#!/usr/bin/env python3
"""Extract source-derived mobile LODs from the user-supplied HumanModelAsset/1 HTML.
No anatomical reconstruction or invented character meshes. Material codes are presentation data.
Usage: python tools/export-human-npc.py '/path/to/인간모델1(옷미구현)(1)(2)(1).html'
"""
from __future__ import annotations
import base64, hashlib, json, re, struct, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/인간모델1(옷미구현)(1)(2)(1).html')
raw = SOURCE.read_bytes()
content = raw.decode('utf-8')
match = re.search(r'<script id="mesh-data" type="application/json">(.*?)</script>', content, re.S)
if not match: raise RuntimeError('Missing HumanModelAsset/1 payload')
payload = json.loads(match.group(1))
pos = np.frombuffer(base64.b64decode(payload['p']), dtype='<i2').reshape(-1,3)
norm = np.frombuffer(base64.b64decode(payload['n']), dtype=np.int8).reshape(-1,3)
faces = np.frombuffer(base64.b64decode(payload['f']), dtype='<u2')
wi = np.frombuffer(base64.b64decode(payload['wi']), dtype=np.uint8).reshape(-1,4)
ww = np.frombuffer(base64.b64decode(payload['ww']), dtype=np.uint8).reshape(-1,4)
bones = payload['bones']; bone_ids=[b['id'] for b in bones]; bone_index={n:i for i,n in enumerate(bone_ids)}
assert len(pos)==len(norm)==len(wi)==len(ww)
assert len(bones)==47 and len(faces)%3==0

def categorize(vertices, name):
    p = pos[vertices].astype(np.float64)/45696.0
    y=p[:,1]
    mat=np.ones(len(vertices),dtype=np.uint8)
    if name.startswith('hand') or 'wrist' in name or name.startswith('elbow_joint'):
        mat.fill(0) # skin on hand/wrist, elbow follows a neutral tone
    elif 'foot' in name or 'ankle' in name:
        mat.fill(3) # boots
    elif ('shin' in name or 'knee' in name or 'thigh' in name):
        mat.fill(2) # trousers
    elif 'upper_arm' in name or 'forearm' in name or 'shoulder' in name:
        mat.fill(1) # tunic/sleeve
    elif name=='body':
        mat=np.where(y>.275,0,np.where(y<-.11,2,1)).astype(np.uint8)
    return mat

def build_lod(voxel):
    chunks=[];tris=[];part_report=[];base=0
    for part in payload['parts']:
        src_indices=faces[part['start']:part['start']+part['count']].reshape(-1,3)
        used=np.unique(src_indices)
        get_local=np.searchsorted(used,src_indices)
        p=pos[used].astype(np.float64)
        ns=norm[used].astype(np.float64)
        ids=np.array([bone_index[x] for x in part['skin']],dtype=np.uint8)
        joints=ids[wi[used].clip(max=len(ids)-1)]
        weights=ww[used].astype(np.float64)
        primary=joints[np.arange(len(used)),weights.argmax(axis=1)]
        material=categorize(used,part['name'])
        # Cluster only within a body part and a dominant-bone/material group.
        cell=np.floor(p/(45696*voxel)+.5).astype(np.int32)
        labels=np.column_stack([cell,primary,material])
        _, inverse=np.unique(labels,axis=0,return_inverse=True)
        n=len(np.unique(inverse));counts=np.bincount(inverse,minlength=n)
        out_p=np.rint(np.column_stack([np.bincount(inverse,weights=p[:,k],minlength=n)/counts for k in range(3)])).clip(-32768,32767).astype(np.int16)
        out_n=np.column_stack([np.bincount(inverse,weights=ns[:,k],minlength=n)/counts for k in range(3)])
        out_n=out_n/np.maximum(np.linalg.norm(out_n,axis=1,keepdims=True),1)
        out_n=np.rint(out_n*127).clip(-127,127).astype(np.int8)
        # Merge original weighted joints inside each cluster, then retain strongest 4.
        blended=np.zeros((n,47),dtype=np.float32)
        for k in range(4):np.add.at(blended,(inverse,joints[:,k]),weights[:,k])
        best=np.argsort(-blended,axis=1,kind='stable')[:,:4].astype(np.uint8)
        best_weight=np.take_along_axis(blended,best,axis=1)
        best_weight=best_weight/np.maximum(best_weight.sum(axis=1,keepdims=True),1)*255
        bw=np.rint(best_weight).clip(0,255).astype(np.uint8)
        out_m=np.asarray([material[np.flatnonzero(inverse==i)[0]] for i in range(n)],dtype=np.uint8)
        remapped=inverse[get_local].astype(np.uint32)
        good=(remapped[:,0]!=remapped[:,1])&(remapped[:,0]!=remapped[:,2])&(remapped[:,1]!=remapped[:,2])
        remapped=remapped[good]
        # Remove duplicate triangles caused by voxel clustering while preserving each original winding.
        flat=np.sort(remapped,axis=1)
        _,unique=np.unique(flat,axis=0,return_index=True)
        remapped=remapped[np.sort(unique)]
        for i in range(n):
            chunks.append(struct.pack('<3h3b4B4BB2x',*map(int,out_p[i]),*map(int,out_n[i]),*map(int,best[i]),*map(int,bw[i]),int(out_m[i])))
        tris.append(remapped+base)
        part_report.append((part['name'],len(remapped)))
        base+=n
    verts=b''.join(chunks)
    all_tris=np.concatenate(tris).flatten()
    if base<65536:
        idx=all_tris.astype('<u2').tobytes();index_type='UNSIGNED_SHORT'
    else:
        idx=all_tris.astype('<u4').tobytes();index_type='UNSIGNED_INT'
    print(f'voxel={voxel} verts={base} triangles={len(all_tris)//3} stride={len(verts)//base} index_type={index_type} kb={(len(verts)+len(idx))//1024}',flush=True)
    return {'voxel':voxel,'vertexCount':base,'triangleCount':len(all_tris)//3,'indexCount':len(all_tris),'indexType':index_type,'vertices':base64.b64encode(verts).decode(),'indices':base64.b64encode(idx).decode()},part_report

lod_near, r_near=build_lod(.008)
lod_far, r_far=build_lod(.020)
assert lod_near['triangleCount'] < len(faces)//3 and lod_far['triangleCount'] < lod_near['triangleCount']
export={
 'format':'SerenveltHumanLOD/1',
 'origin':'HumanModelAsset/1, user-supplied model; original topology is source of all generated faces',
 'sourceFile':SOURCE.name,
 'sourceSha256':hashlib.sha256(raw).hexdigest(),
 'positionDivisor':45696,
 'sourceFaces':len(faces)//3,
 'sourceVertices':len(pos),
 'bones':bones,
 'lods':{'near':lod_near,'far':lod_far}
}
js='/* Derived from user-provided HumanModelAsset/1. No new anatomical modeling. */\nwindow.SerenveltHumanLOD='+json.dumps(export,ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT/'assets'/'human_npc_lod.js').write_text(js,encoding='utf-8')
summary={'sourceSHA':export['sourceSha256'],'originalFaces':len(faces)//3,'lod_near':{k:v for k,v in lod_near.items() if k not in ('vertices','indices')},'lod_far':{k:v for k,v in lod_far.items() if k not in ('vertices','indices')},'part_faces':r_near}
(ROOT/'docs'/'human-npc-provenance.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
