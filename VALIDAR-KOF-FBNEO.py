#!/usr/bin/env python3
import sys, zipfile, shutil
from pathlib import Path
EXPECTED_PARENT={
'265-m1.m1':'85aaa632','265-v1.v1':'15e8f3f5','265-v2.v2':'da41d6f9','265-c1.c1':'2b65a656','265-c2.c2':'adf18983','265-c3.c3':'875e9fd7','265-c4.c4':'2da13947','265-c5.c5':'61bd165d','265-c6.c6':'03fdd1eb','265-c7.c7':'1a2749d8','265-c8.c8':'ab0bb549'}
EXPECTED_BIOS={'sp-s2.sp1':'9036d879','sfix.sfix':'c2ea0cfd','000-lo.lo':'5a86cff2','sm1.sm1':'94416d67'}
def check(path,expected):
    with zipfile.ZipFile(path) as z:
        got={Path(i.filename).name.lower():f'{i.CRC:08x}' for i in z.infolist() if not i.is_dir()}
    bad=[]
    for n,crc in expected.items():
        if got.get(n.lower())!=crc: bad.append((n,crc,got.get(n.lower(),'AUSENTE')))
    return bad
if len(sys.argv)!=3:
    print('Uso: python VALIDAR-KOF-FBNEO.py kof2002.zip neogeo.zip');sys.exit(2)
parent,bios=map(Path,sys.argv[1:]);bp=check(parent,EXPECTED_PARENT);bb=check(bios,EXPECTED_BIOS)
for title,bad in [('KOF2002',bp),('NEOGEO BIOS',bb)]:
    print('\n'+title)
    if not bad: print('  OK - compatível com os arquivos esperados pelo FBNeo')
    else:
        for n,exp,got in bad: print(f'  ERRO {n}: esperado {exp}, encontrado {got}')
if bp or bb: sys.exit(1)
out=Path(__file__).resolve().parent/'roms';out.mkdir(exist_ok=True)
shutil.copy2(parent,out/'kof2002-fbneo.zip');shutil.copy2(bios,out/'neogeo.zip')
print('\nOK: arquivos copiados para roms/kof2002-fbneo.zip e roms/neogeo.zip')
