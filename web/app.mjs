import {run,parse,VppError} from './vpp-core.mjs';
import {bridge} from './cvnss.mjs';
const $=id=>document.getElementById(id);
const examples=[
  {id:'xin_chao',title:'Xin chào V++',topic:'Khởi đầu',detail:'In thông điệp và phép tính ra màn hình.',code:`// Bài 01 — Chương trình đầu tiên
hàm chính() {
  in "Xin chào Việt Nam!";
  in "2 + 3 = " + (2 + 3);
};`},
  {id:'bien',title:'Biến và kiểu dữ liệu',topic:'Nền tảng',detail:'Lưu số, văn bản và giá trị logic.',code:`// Bài 02 — Biến và giá trị
hàm chính() {
  tên = "Lan";
  tuổi = 15;
  học_sinh = đúng;
  in "Học sinh: " + tên;
  in "Tuổi năm sau: " + (tuổi + 1);
  in "Đang học: " + học_sinh;
};`},
  {id:'dieu_kien',title:'Nếu / hoặc',topic:'Rẽ nhánh',detail:'Giải thích cách chương trình đưa ra quyết định.',code:`// Bài 03 — Phân loại kết quả học tập
hàm chính() {
  điểm = 8.5;
  nếu (điểm >= 8) {
    in "Kết quả: Giỏi";
  } hoặc nếu (điểm >= 5) {
    in "Kết quả: Đạt";
  } hoặc {
    in "Cần cố gắng";
  };
};`},
  {id:'lap',title:'Vòng lặp đếm',topic:'Lặp',detail:'Tính tổng các số từ 1 đến 10.',code:`// Bài 04 — Tính tổng bằng vòng lặp
hàm chính() {
  tổng = 0;
  lặp (i = 1; i <= 10; i++) {
    tổng += i;
  };
  in "Tổng 1..10 = " + tổng;
};`},
  {id:'ham',title:'Hàm và tham số',topic:'Hàm',detail:'Chia chương trình thành khối tái sử dụng.',code:`// Bài 05 — Hàm tính diện tích
hàm diện_tích_chữ_nhật(dài, rộng) {
  trả về dài * rộng;
};
hàm chính() {
  s = diện_tích_chữ_nhật(6, 4);
  in "Diện tích = " + s;
};`},
  {id:'mang',title:'Danh sách và chỉ số',topic:'Cấu trúc dữ liệu',detail:'Lưu nhiều giá trị và đọc theo chỉ số.',code:`// Bài 06 — Danh sách điểm kiểm tra
hàm chính() {
  điểm = [8, 9, 7, 10];
  tổng = 0;
  lặp (i = 0; i < độ_dài(điểm); i++) {
    tổng += điểm[i];
  };
  in "Điểm trung bình = " + (tổng / độ_dài(điểm));
};`},
  {id:'ban_do',title:'Từ điển dữ liệu',topic:'Cấu trúc dữ liệu',detail:'Biểu diễn một đối tượng bằng các khóa có tên.',code:`// Bài 07 — Hồ sơ lớp học
hàm chính() {
  lớp_học = {"tên": "9A", "sĩ_số": 42};
  in "Lớp: " + lớp_học["tên"];
  in "Sĩ số: " + lớp_học["sĩ_số"];
};`},
  {id:'de_quy',title:'Đệ quy giai thừa',topic:'Thuật toán',detail:'Giải bài toán bằng lời gọi hàm lặp lại.',code:`// Bài 08 — Giai thừa (n!)
hàm giai_thừa(n) {
  nếu (n <= 1) { trả về 1; };
  trả về n * giai_thừa(n - 1);
};
hàm chính() {
  in "5! = " + giai_thừa(5);
};`},
  {id:'tim_max',title:'Tìm giá trị lớn nhất',topic:'Thuật toán',detail:'Duyệt dữ liệu và lưu lời giải tốt nhất.',code:`// Bài 09 — Tìm số lớn nhất
hàm chính() {
  số = [14, 52, 8, 72, 23];
  lớn = số[0];
  lặp (i = 1; i < độ_dài(số); i++) {
    nếu (số[i] > lớn) { lớn = số[i]; };
  };
  in "Giá trị lớn nhất: " + lớn;
};`},
  {id:'lua_chon',title:'Chọn / ca / mặc định',topic:'Rẽ nhánh',detail:'Chọn hành động ứng với một giá trị.',code:`// Bài 10 — Chọn nhánh theo mã trạng thái
hàm chính() {
  trạng_thái = 200;
  chọn (trạng_thái) {
    ca 200: { in "Đã hoàn thành"; }
    ca 404: { in "Không tìm thấy"; }
    mặc định: { in "Trạng thái khác"; }
  };
};`},
  {id:'bat_loi',title:'Thử / bắt lỗi',topic:'Nâng cao',detail:'Xử lý tình huống ngoại lệ có kiểm soát.',code:`// Bài 11 — Xử lý ngoại lệ
hàm chính() {
  thử {
    ném "Chưa có dữ liệu phù hợp";
  } bắt lỗi (thông_báo) {
    in "Đã bắt lỗi: " + thông_báo;
  };
};`},
];
const key='vpp-classroom-v1';let selected=0,currentMode='native',adapter=null;
try{adapter=bridge(window.CVNSSConverter)}catch(e){console.warn('CVNSS4.0 không khả dụng:',e.message);}
function mark(text,cls){const el=$(text);if(el)el.className=cls;}
function currentExample(){return examples[selected];}
function codeOf(e){return e.code;}
function renderTree(){
 const tree=$('file-tree');tree.replaceChildren();
 examples.forEach((e,index)=>{const button=document.createElement('button');button.type='button';button.textContent='│  '+(index<9?'0':'')+(index+1)+' '+e.id.toUpperCase()+'.VI';button.title=e.title;button.className=index===selected?'active':'';
 button.addEventListener('click',()=>selectExample(index));tree.append(button);});
}
function selectExample(index){
 selected=index;currentMode='native';$('cvnss-mode').checked=false;
 $('source').value=codeOf(currentExample());$('editor-title').textContent=currentExample().id.toUpperCase()+'.VI';
 $('code-mode').textContent='V++ NATIVE';renderTree();updateEditor();setOutput('Đã mở '+currentExample().id.toUpperCase()+'.VI\nNhấn F9 để chạy chương trình.');
 document.getElementById('ide').scrollIntoView({behavior:'smooth',block:'start'});
}
function setOutput(msg,error=false){$('output').textContent=msg;$('output').classList.toggle('error',error);$('run-state').textContent=error?'CHẠY THẤT BẠI':'SẴN SÀNG';$('problem').textContent=error?'1 LỖI':'0 LỖI';}
function updateEditor(){
 const src=$('source'),value=src.value,lines=value.split('\n');
 $('line-numbers').textContent=lines.map((_,i)=>String(i+1)).join('\n');
 const pos=src.selectionStart,upto=value.slice(0,pos).split('\n');
 $('position').textContent=`DÒNG ${upto.length} · CỘT ${upto.at(-1).length+1}`;
}
function effectiveCode(){return currentMode==='cvnss'&&adapter?adapter.decodeKeywords($('source').value):$('source').value;}
function execute(){
 try{
  const result=run(effectiveCode(),{maxSteps:80000,maxOutput:40000,maxDepth:64});
  setOutput('C:\\VPP\\> vpp chạy '+currentExample().id+'.vi\n\n'+(result.output||'(Chương trình hoàn tất, không có lệnh in.)')+'\n\n✓ Hoàn tất.');
  $('stats').textContent=`BƯỚC CHẠY: ${result.steps.toLocaleString('vi-VN')}`;$('run-state').textContent='THÀNH CÔNG';
 }catch(error){
  const place=error.line?`Dòng ${error.line}, cột ${error.column}: `:'';
  setOutput('C:\\VPP\\> lỗi\n\n✗ '+place+error.message+'\n\nGợi ý: kiểm tra dấu ;, ngoặc, biến và cú pháp.',true);
  $('stats').textContent='BƯỚC CHẠY: —';
 }
}
function save(){try{localStorage.setItem(key,JSON.stringify({id:currentExample().id,source:$('source').value,mode:currentMode}));setOutput('✓ Đã lưu mã trên trình duyệt này.\nTệp không được gửi lên máy chủ.');}catch{setOutput('Không lưu được trong trình duyệt. Hãy dùng nút TẢI .VI.',true);}}
function download(){const contents=effectiveCode(),blob=new Blob([contents],{type:'text/plain;charset=utf-8'});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=currentExample().id+'.vi';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
function restore(){try{const obj=JSON.parse(localStorage.getItem(key)||'null');if(!obj||typeof obj.source!=='string')return;const i=examples.findIndex(e=>e.id===obj.id);if(i>=0)selected=i;$('source').value=obj.source;currentMode=obj.mode==='cvnss'&&adapter?'cvnss':'native';$('cvnss-mode').checked=currentMode==='cvnss';$('code-mode').textContent=currentMode==='cvnss'?'TỪ KHÓA CVNSS4.0':'V++ NATIVE';$('editor-title').textContent=currentExample().id.toUpperCase()+'.VI';renderTree();updateEditor();}catch{}}
function toggleMode(enabled){
 if(!adapter){$('cvnss-mode').checked=false;setOutput('Không tải được bộ chuyển đổi CVNSS4.0 đã kiểm toán.',true);return;}
 try{
  const value=$('source').value;
  if(enabled&&currentMode==='native'){$('source').value=adapter.encodeKeywords(value);currentMode='cvnss';}
  if(!enabled&&currentMode==='cvnss'){$('source').value=adapter.decodeKeywords(value);currentMode='native';}
  $('code-mode').textContent=currentMode==='cvnss'?'TỪ KHÓA CVNSS4.0':'V++ NATIVE';
  updateEditor();setOutput('Đã đổi chế độ từ khóa. Chuỗi, chú thích và tên biến được giữ nguyên.\nNhấn F9 để kiểm tra chương trình.');
 }catch(e){setOutput('Không thể đổi chế độ: '+e.message,true);}
}
function renderCourses(){const grid=$('course-grid');examples.slice(0,8).forEach((e,i)=>{
 const button=document.createElement('button');button.type='button';button.className='course-card';
 const no=document.createElement('span');no.className='course-n';no.textContent='BÀI '+String(i+1).padStart(2,'0')+' / '+e.topic.toUpperCase();
 const title=document.createElement('strong');title.textContent=e.title;
 const sub=document.createElement('small');sub.textContent=e.detail;
 const link=document.createElement('span');link.className='course-link';link.textContent='MỞ BÀI HỌC →';
 button.append(no,title,sub,link);button.addEventListener('click',()=>selectExample(i));grid.append(button);
 });}
function renderAudit(){
 if(!adapter){$('audit-status').textContent='⚠ CVNSS4.0 KHÔNG KHẢ DỤNG';return;}
 $('audit-status').textContent='✓ AUDIT 5.0.0 · '+adapter.audit.ambiguityGroups+' NHÓM NHẬP NHẰNG';
 const list=$('dictionary');for(const [source,cvnss] of adapter.dictionary.slice(0,7).map(x=>[x.source,x.cvnss])){
  for(const [cls,txt] of [['dict-value',source],['dict-arrow','→'],['dict-value','@'+cvnss]]){const div=document.createElement('div');div.className=cls;div.textContent=txt;list.append(div);}
 }
 for(const item of adapter.dictionary){const row=document.createElement('div');const a=document.createElement('b');a.textContent=item.source;const b=document.createElement('span');b.textContent='@'+item.cvnss;row.append(a,b);$('alias-list').append(row);}
}
renderTree();$('source').value=currentExample().code;$('editor-title').textContent=currentExample().id.toUpperCase()+'.VI';updateEditor();restore();renderCourses();renderAudit();
$('run').addEventListener('click',execute);$('save').addEventListener('click',save);$('download').addEventListener('click',download);
$('open').addEventListener('click',()=>$('file').click());$('reset').addEventListener('click',()=>selectExample(selected));
$('file').addEventListener('change',async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>200000){setOutput('Tệp vượt quá 200 KB, không phù hợp cho trình chạy lớp học.',true);return;}
 $('source').value=await f.text();currentMode='native';$('cvnss-mode').checked=false;$('code-mode').textContent='V++ NATIVE';updateEditor();setOutput('✓ Đã mở tệp '+f.name+' trên máy của bạn.');e.target.value='';
});
$('cvnss-mode').addEventListener('change',e=>toggleMode(e.target.checked));
const source=$('source');
source.addEventListener('input',updateEditor);source.addEventListener('keyup',updateEditor);source.addEventListener('click',updateEditor);
source.addEventListener('scroll',()=>{$('line-numbers').scrollTop=source.scrollTop;});
source.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const pos=source.selectionStart;source.setRangeText('  ',pos,source.selectionEnd,'end');updateEditor();}});
document.addEventListener('keydown',e=>{
 if(e.key==='F9'){e.preventDefault();execute();}
 if(e.key==='F1'){e.preventDefault();document.getElementById('bai-hoc').scrollIntoView({behavior:'smooth'});}
 if(e.key==='F2'||(e.ctrlKey&&e.key.toLowerCase()==='s')){e.preventDefault();save();}
 if(e.key==='F3'){e.preventDefault();$('file').click();}
});
$('show-alias').addEventListener('click',()=>$('alias-dialog').showModal());
$('close-alias').addEventListener('click',()=>$('alias-dialog').close());
