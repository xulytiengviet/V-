import assert from 'node:assert/strict';
import {parse,run,VppError} from './vpp-core.mjs';
import {createRequire} from 'node:module';
import {bridge} from './cvnss.mjs';
const require=createRequire(import.meta.url);
const converter=require('./vendor/cvnss4-audit-safe.js');
const cases=[
  ['chào',`hàm chính() { in "Xin chào V++!"; };`,'Xin chào V++!'],
  ['biến',`a = 2; b = 3; in a + b * 4;`,'14'],
  ['điều kiện',`điểm=8; nếu(điểm>=8){in "giỏi";} hoặc nếu(điểm>=5){in "đạt";} hoặc{in "trượt";};`,'giỏi'],
  ['vòng lặp',`tổng=0; lặp(i=1;i<=5;i++){tổng += i;} in tổng;`,'15'],
  ['bỏ qua & thoát',`lặp(i=0;i<10;i++){ nếu(i==2){bỏ qua;}; nếu(i==5){thoát;}; in i;};`,'0\n1\n3\n4'],
  ['hàm',`hàm cộng(a,b=10){trả về a+b;}; hàm chính(){in cộng(3);in cộng(2,4);};`,'13\n6'],
  ['đệ quy',`hàm giai_thừa(n){nếu(n<=1){trả về 1;};trả về n*giai_thừa(n-1);};in giai_thừa(5);`,'120'],
  ['danh sách',`a=[4,5,6];a[1]=10;in a[1];in độ_dài(a);`,'10\n3'],
  ['từ điển',`a={"tên":"Hà Nội","dân":9};in a["tên"];`,'Hà Nội'],
  ['ngoại lệ',`thử{ném "sai dữ liệu";} bắt lỗi(e){in e;};`,'sai dữ liệu'],
  ['logic',`in (đúng && !sai);in (rỗng || 7);`,'đúng\n7'],
  ['chuỗi an toàn',`// Nếu có in trong chú thích\nin "nếu hàm trong chuỗi";`,'nếu hàm trong chuỗi'],
  ['đầu vào',`in "Xin chào " + đầu_vào();`,'Xin chào lớp 9'],
];
for(const [name,src,out] of cases){assert.equal(run(src,{input:'lớp 9'}).output,out,`Test: ${name}`);}
assert.throws(()=>run('lặp(i=0;i<99999999;i++){in i;}',{maxSteps:100}),/Vượt giới hạn/);
assert.throws(()=>run('in 1/0;'),/chia cho 0/);
assert.throws(()=>parse('in "abc;'),/chưa có/);
assert.throws(()=>run('a={"__proto__":1};'),/không an toàn/);
assert.throws(()=>run('in chưa_khai_báo;'),/chưa được khai báo/);
assert.equal(converter.selfTest().ok,true);
const cvn=bridge(converter);
assert.equal(cvn.audit.ambiguityGroups,56);
const original='hàm chính(){ in "nếu trả về"; nếu (đúng) { in "ổn"; }; }; // trả về';
const coded=cvn.encodeKeywords(original);
assert.equal(cvn.decodeKeywords(coded),original);
assert.equal(run(cvn.decodeKeywords(coded)).output,'nếu trả về\nổn');
const collision='ham = 10; hàm chính() { in ham; };';
assert.equal(cvn.decodeKeywords(cvn.encodeKeywords(collision)),collision);
assert.equal(run(cvn.decodeKeywords(cvn.encodeKeywords(collision))).output,'10');
console.log(`OK ${cases.length+9} kiểm thử cơ bản + CVNSS4.0 audit-safe`);
