/** V++ Classroom VM: safe educational interpreter, NOT the native C++ compiler.
 * No eval / Function / remote execution / implicit host capabilities.
 */
export class VppError extends Error {
  constructor(message, token) {
    super(message); this.name = 'VppError'; this.line = token?.line ?? 1; this.column = token?.column ?? 1;
  }
}
const isStart = c => /[\p{L}_]/u.test(c || '');
const isPart = c => /[\p{L}\p{M}\p{N}_]/u.test(c || '');
const OPS = ['==','!=','<=','>=','&&','||','+=','-=','*=','/=','%=','++','--'];
const KEYWORDS = new Set(['hàm','in','nếu','hoặc','lặp','trả','về','đúng','sai','rỗng','thoát','bỏ','qua','thử','bắt','lỗi','ném','chọn','ca','mặc','định']);
export function lex(source) {
  const s=String(source).normalize('NFC'); const tokens=[];
  let p=0,line=1,column=1;
  const peek=(n=0)=>s[p+n];
  const take=()=>{ const c=s[p++]; if(c==='\n'){line++;column=1;}else column++; return c; };
  const push=(kind,value,start)=>tokens.push({kind,value,line:start.line,column:start.column});
  while(p<s.length){
    let c=peek();if(/\s/u.test(c)){take();continue;}
    const start={line,column};
    if(c==='/' && peek(1)==='/'){while(p<s.length&&peek()!=='\n')take();continue;}
    if(c==='/' && peek(1)==='*'){
      take();take(); let closed=false;
      while(p<s.length){if(peek()==='*'&&peek(1)==='/'){take();take();closed=true;break;}take();}
      if(!closed)throw new VppError('Chú thích khối chưa được đóng.',start);
      continue;
    }
    if(c==='"'||c==="'"){
      const quote=take();let value='',closed=false;
      while(p<s.length){c=take();if(c===quote){closed=true;break;}
        if(c==='\\'){const esc=take(); if(esc===undefined)break;
          const escape={n:'\n',t:'\t',r:'\r','\\':'\\','"':'"',"'":"'"};value+=escape[esc]??('\\'+esc);
        }else{value+=c;}
      }
      if(!closed)throw new VppError('Chuỗi chưa có dấu nháy kết thúc.',start);
      push('string',value,start);continue;
    }
    if(/[0-9]/.test(c)){
      let raw='';while(/[0-9]/.test(peek()||''))raw+=take();
      if(peek()==='.'&&/[0-9]/.test(peek(1)||'')){raw+=take();while(/[0-9]/.test(peek()||''))raw+=take();}
      push('number',Number(raw),start);continue;
    }
    if(isStart(c)){
      let value='';while(isPart(peek()))value+=take();
      push(KEYWORDS.has(value)?'keyword':'identifier',value,start);continue;
    }
    const op=OPS.find(x=>s.startsWith(x,p));if(op){take();take();push('symbol',op,start);continue;}
    if('+-*/%=!<>;:,(){}[].'.includes(c)){push('symbol',take(),start);continue;}
    throw new VppError(`Ký tự không hợp lệ: ${c}`,start);
  }
  tokens.push({kind:'eof',value:'<EOF>',line,column});return tokens;
}
const P={ '||':1,'&&':2,'==':3,'!=':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6 };
const ASSIGN=new Set(['=','+=','-=','*=','/=','%=']);
class Parser{
  constructor(tokens){this.t=tokens;this.i=0;}
  at(v){return this.t[this.i].value===v;}
  cur(){return this.t[this.i];}
  eat(v){if(this.at(v)){return this.t[this.i++];}return null;}
  need(v){const t=this.eat(v);if(!t)throw new VppError(`Cần '${v}' nhưng gặp '${this.cur().value}'.`,this.cur());return t;}
  next(){return this.t[this.i++];}
  name(){const t=this.cur();if(t.kind!=='identifier'&&t.kind!=='keyword')throw new VppError('Cần tên biến hoặc tên hàm.',t);this.i++;return t.value;}
  optionalSemicolon(){this.eat(';');}
  parse(){const body=[];while(this.cur().kind!=='eof')body.push(this.statement());return {type:'program',body};}
  block(){this.need('{');const body=[];while(!this.at('}')){if(this.cur().kind==='eof')throw new VppError('Thiếu dấu } đóng khối.',this.cur());body.push(this.statement());}this.need('}');return {type:'block',body};}
  statement(){
    const tok=this.cur();
    if(this.eat(';'))return {type:'empty'};
    if(this.at('{')){const block=this.block();this.optionalSemicolon();return block;}
    if(this.eat('hàm')){
      const name=this.name();this.need('(');const params=[];
      if(!this.at(')'))do{const p=this.name();const def=this.eat('=')?this.expr():null;params.push({name:p,def});}while(this.eat(','));
      this.need(')');const body=this.block();this.optionalSemicolon();return {type:'function',name,params,body,loc:tok};
    }
    if(this.eat('in')){const value=this.expr();this.need(';');return {type:'print',value,loc:tok};}
    if(this.eat('trả')){this.need('về');const value=this.at(';')?null:this.expr();this.need(';');return {type:'return',value,loc:tok};}
    if(this.eat('thoát')){this.need(';');return {type:'break',loc:tok};}
    if(this.eat('bỏ')){this.need('qua');this.need(';');return {type:'continue',loc:tok};}
    if(this.eat('ném')){const value=this.expr();this.need(';');return {type:'throw',value,loc:tok};}
    if(this.eat('thử')){
      const body=this.block();this.need('bắt');this.need('lỗi');
      this.need('(');const name=this.name();this.need(')');const handler=this.block();this.optionalSemicolon();return {type:'try',body,name,handler,loc:tok};
    }
    if(this.eat('nếu')){
      this.need('(');const condition=this.expr();this.need(')');const yes=this.block();let no=null;
      if(this.eat('hoặc')){
        if(this.at('nếu'))no=this.statement();else no=this.block();
      }
      this.optionalSemicolon();return {type:'if',condition,yes,no,loc:tok};
    }
    if(this.eat('chọn')){
      this.need('(');const value=this.expr();this.need(')');this.need('{');
      const arms=[];let hasDefault=false;
      while(!this.at('}')){
        if(this.cur().kind==='eof')throw new VppError('Thiếu } đóng chọn.',this.cur());
        if(this.eat('ca')){const test=this.expr();this.need(':');arms.push({test,body:this.block()});continue;}
        if(this.eat('mặc')){this.need('định');this.need(':');if(hasDefault)throw new VppError('Không được khai báo mặc định hai lần.',this.cur());hasDefault=true;arms.push({test:null,body:this.block()});continue;}
        throw new VppError('Trong chọn, dùng ca <giá trị>: { ... } hoặc mặc định: { ... }.',this.cur());
      }
      this.need('}');this.optionalSemicolon();return {type:'switch',value,arms,loc:tok};
    }
    if(this.eat('lặp')){
      this.need('(');const init=this.at(';')?null:this.expr();this.need(';');
      const condition=this.at(';')?null:this.expr();this.need(';');
      const next=this.at(')')?null:this.expr();this.need(')');const body=this.block();this.optionalSemicolon();
      return {type:'for',init,condition,next,body,loc:tok};
    }
    const value=this.expr();this.need(';');return {type:'expr',value,loc:tok};
  }
  expr(min=0){
    let lhs=this.prefix();
    for(;;){
      const tok=this.cur(),op=tok.value;
      if(this.eat('(')){
        const args=[];if(!this.at(')'))do{args.push(this.expr());}while(this.eat(','));this.need(')');lhs={type:'call',fn:lhs,args,loc:tok};continue;
      }
      if(this.eat('[')){const index=this.expr();this.need(']');lhs={type:'index',obj:lhs,index,loc:tok};continue;}
      if(this.eat('.')){const key=this.name();lhs={type:'member',obj:lhs,key,loc:tok};continue;}
      if((op==='++'||op==='--')&&min<=7){this.next();lhs={type:'inc',target:lhs,op,loc:tok};continue;}
      if(ASSIGN.has(op)){
        if(min>0)break;this.next();const rhs=this.expr(0);lhs={type:'assign',target:lhs,op,rhs,loc:tok};continue;
      }
      const prec=P[op];if(prec===undefined||prec<min)break;
      this.next();const rhs=this.expr(prec+1);lhs={type:'binary',op,left:lhs,right:rhs,loc:tok};
    }
    return lhs;
  }
  prefix(){
    const tok=this.next(),v=tok.value;
    if(tok.kind==='number'||tok.kind==='string')return {type:'literal',value:v,loc:tok};
    if(v==='đúng')return {type:'literal',value:true,loc:tok};
    if(v==='sai')return {type:'literal',value:false,loc:tok};
    if(v==='rỗng')return {type:'literal',value:null,loc:tok};
    if(v==='!'||v==='-'||v==='+')return {type:'unary',op:v,arg:this.expr(7),loc:tok};
    if(v==='('){const result=this.expr();this.need(')');return result;}
    if(v==='['){const items=[];if(!this.at(']'))do{items.push(this.expr());}while(this.eat(','));this.need(']');return {type:'array',items,loc:tok};}
    if(v==='{'){
      const entries=[];
      if(!this.at('}'))do{
        const keyTok=this.next();if(keyTok.kind!=='string'&&keyTok.kind!=='identifier'&&keyTok.kind!=='keyword')throw new VppError('Khóa từ điển phải là chuỗi hoặc tên.',keyTok);
        this.need(':');entries.push([String(keyTok.value),this.expr()]);
      }while(this.eat(','));this.need('}');return {type:'map',entries,loc:tok};
    }
    if(tok.kind==='identifier')return {type:'var',name:v,loc:tok};
    throw new VppError(`Biểu thức không hợp lệ tại '${v}'.`,tok);
  }
}
export function parse(source){return new Parser(lex(source)).parse();}
class Env{
  constructor(parent=null){this.parent=parent;this.values=new Map();}
  get(name,loc){if(this.values.has(name))return this.values.get(name);if(this.parent)return this.parent.get(name,loc);throw new VppError(`Biến '${name}' chưa được khai báo.`,loc);}
  set(name,value){if(this.values.has(name)){this.values.set(name,value);return value;}if(this.parent&&this.parent.has(name))return this.parent.set(name,value);this.values.set(name,value);return value;}
  has(name){return this.values.has(name)||(this.parent?.has(name)??false);}
  define(name,v){this.values.set(name,v);}
}
class Signal{constructor(type,value){this.type=type;this.value=value;}}
const stringify=v=>v===null?'rỗng':typeof v==='boolean'?(v?'đúng':'sai'):Array.isArray(v)?'['+v.map(stringify).join(', ')+']':typeof v==='object'?(v?.kind==='userfn'?`<hàm ${v.name}>`:JSON.stringify(v)):String(v);
const truthy=v=>!!v;
const safeKey=(k,loc)=>{k=String(k);if(['__proto__','prototype','constructor'].includes(k))throw new VppError('Khóa không an toàn trong từ điển.',loc);return k;};
export function run(source,{input='',maxSteps=80000,maxOutput=40000,maxDepth=64}={}){
  const ast=parse(source);const lines=[];let steps=0,depth=0,outputLength=0;
  const step=loc=>{if(++steps>maxSteps)throw new VppError('Vượt giới hạn bước chạy. Kiểm tra vòng lặp vô hạn.',loc);};
  const echo=v=>{const s=stringify(v);outputLength+=s.length;if(outputLength>maxOutput)throw new VppError('Vượt giới hạn dung lượng đầu ra.');lines.push(s);};
  const global=new Env();
  const native=(name,fn)=>global.define(name,{kind:'native',name,fn});
  native('độ_dài',a=>a?.length??(a&&typeof a==='object'?Object.keys(a).length:0));
  native('chuỗi',v=>stringify(v)); native('số',v=>{const n=Number(v);if(!Number.isFinite(n))throw new VppError('Không thể chuyển thành số.');return n;});
  native('căn_bậc_hai',Math.sqrt); native('trị_tuyệt_đối',Math.abs);native('làm_tròn',Math.round);
  native('lớn_nhất',(...a)=>Math.max(...a));native('nhỏ_nhất',(...a)=>Math.min(...a));
  native('đầu_vào',()=>String(input));
  const own=(obj,index,loc)=>{
    if(obj===null||obj===undefined)throw new VppError('Không thể truy cập giá trị rỗng.',loc);
    const key=safeKey(index,loc);
    if(Array.isArray(obj)||typeof obj==='string'){
      if(key==='length')return obj.length;
      if(!/^(0|[1-9]\d*)$/.test(key))throw new VppError('Chỉ số danh sách phải là số nguyên không âm.',loc);
      return obj[Number(key)]??null;
    }
    if(typeof obj==='object'&&Object.hasOwn(obj,key))return obj[key];return null;
  };
  const ref=(node,env)=>{
    if(node.type==='var')return {get:()=>env.get(node.name,node.loc),set:v=>env.set(node.name,v)};
    if(node.type==='index'||node.type==='member'){
      const obj=evaluate(node.obj,env),key=node.type==='member'?node.key:evaluate(node.index,env);
      const target=own(obj,key,node.loc);void target;
      if(typeof obj==='string')throw new VppError('Không thể sửa chuỗi tại vị trí chỉ số.',node.loc);
      const k=safeKey(key,node.loc);
      if(Array.isArray(obj)&&(!/^(0|[1-9]\d*)$/.test(k)||Number(k)>10000))throw new VppError('Chỉ số danh sách không hợp lệ.',node.loc);
      if(obj===null||typeof obj!=='object')throw new VppError('Đích gán không phải danh sách/từ điển.',node.loc);
      return {get:()=>own(obj,k,node.loc),set:v=>(obj[k]=v)};
    }
    throw new VppError('Vế trái không thể gán giá trị.',node.loc);
  };
  const numeric=(v,loc)=>{if(typeof v!=='number'||!Number.isFinite(v))throw new VppError('Phép toán yêu cầu số hữu hạn.',loc);return v;};
  const binary=(op,a,b,loc)=>{
    switch(op){
      case '+':return typeof a==='string'||typeof b==='string'?stringify(a)+stringify(b):numeric(a,loc)+numeric(b,loc);
      case '-':return numeric(a,loc)-numeric(b,loc);case '*':return numeric(a,loc)*numeric(b,loc);
      case '/':if(numeric(b,loc)===0)throw new VppError('Không thể chia cho 0.',loc);return numeric(a,loc)/b;
      case '%':if(numeric(b,loc)===0)throw new VppError('Không thể chia lấy dư cho 0.',loc);return numeric(a,loc)%b;
      case '==':return a===b;case '!=':return a!==b;
      case '<':return a<b;case '<=':return a<=b;case '>':return a>b;case '>=':return a>=b;
    }
    throw new VppError('Toán tử không hỗ trợ: '+op,loc);
  };
  function call(fn,args,loc){
    if(!fn||!['native','userfn'].includes(fn.kind))throw new VppError('Giá trị được gọi không phải hàm.',loc);
    if(fn.kind==='native')return fn.fn(...args);
    if(++depth>maxDepth)throw new VppError('Vượt giới hạn đệ quy an toàn.',loc);
    try{
      if(args.length>fn.params.length)throw new VppError(`Hàm '${fn.name}' nhận tối đa ${fn.params.length} tham số.`,loc);
      const local=new Env(fn.env);
      fn.params.forEach((p,i)=>local.define(p.name,i<args.length?args[i]:p.def?evaluate(p.def,local):null));
      try{execute(fn.body,local);return null;}catch(s){if(s instanceof Signal&&s.type==='return')return s.value;throw s;}
    }finally{depth--;}
  }
  function evaluate(n,env){
    step(n.loc);switch(n.type){
      case 'literal':return n.value;
      case 'var':return env.get(n.name,n.loc);
      case 'array':return n.items.map(x=>evaluate(x,env));
      case 'map':{const obj=Object.create(null);for(const [k,v] of n.entries)obj[safeKey(k,n.loc)]=evaluate(v,env);return obj;}
      case 'index':return own(evaluate(n.obj,env),evaluate(n.index,env),n.loc);
      case 'member':return own(evaluate(n.obj,env),n.key,n.loc);
      case 'unary':{const v=evaluate(n.arg,env);return n.op==='!'?!truthy(v):n.op==='-'?-numeric(v,n.loc):numeric(v,n.loc);}
      case 'binary':{
        const a=evaluate(n.left,env);
        if(n.op==='&&')return truthy(a)?evaluate(n.right,env):a;
        if(n.op==='||')return truthy(a)?a:evaluate(n.right,env);
        return binary(n.op,a,evaluate(n.right,env),n.loc);
      }
      case 'assign':{
        const r=ref(n.target,env),v=evaluate(n.rhs,env);
        if(n.op==='=')return r.set(v);
        return r.set(binary(n.op.slice(0,1),r.get(),v,n.loc));
      }
      case 'inc':{const r=ref(n.target,env),v=numeric(r.get(),n.loc);r.set(v+(n.op==='++'?1:-1));return v;}
      case 'call':return call(evaluate(n.fn,env),n.args.map(x=>evaluate(x,env)),n.loc);
      default:throw new VppError('Biểu thức chưa hỗ trợ: '+n.type,n.loc);
    }
  }
  function execute(node,env){
    step(node.loc);
    if(node.type==='program'||node.type==='block'){
      const local=node.type==='program'?env:new Env(env);
      for(const st of node.body){if(st.type==='function')local.define(st.name,{kind:'userfn',name:st.name,params:st.params,body:st.body,env:local});}
      for(const st of node.body){if(st.type!=='function')execute(st,local);}return;
    }
    switch(node.type){
      case 'empty':case 'function':return;
      case 'expr':return evaluate(node.value,env);
      case 'print':return echo(evaluate(node.value,env));
      case 'if':return truthy(evaluate(node.condition,env))?execute(node.yes,env):node.no?execute(node.no,env):undefined;
      case 'switch':{
        const value=evaluate(node.value,env);
        let fallback=null;
        for(const arm of node.arms){if(arm.test===null){fallback=arm;continue;}
          if(evaluate(arm.test,env)===value){try{execute(arm.body,env);}catch(s){if(!(s instanceof Signal&&s.type==='break'))throw s;}return;}
        }
        if(fallback){try{execute(fallback.body,env);}catch(s){if(!(s instanceof Signal&&s.type==='break'))throw s;}}
        return;
      }
      case 'for':{
        const local=new Env(env);if(node.init)evaluate(node.init,local);
        while(!node.condition||truthy(evaluate(node.condition,local))){
          step(node.loc);
          try{execute(node.body,local);}catch(s){if(s instanceof Signal&&s.type==='break')break;if(!(s instanceof Signal&&s.type==='continue'))throw s;}
          if(node.next)evaluate(node.next,local);
        }return;
      }
      case 'return':throw new Signal('return',node.value?evaluate(node.value,env):null);
      case 'break':throw new Signal('break');case 'continue':throw new Signal('continue');
      case 'throw':throw new Signal('userthrow',evaluate(node.value,env));
      case 'try':{
        try{execute(node.body,env);}catch(s){if(!(s instanceof Signal&&s.type==='userthrow'))throw s;
          const local=new Env(env);local.define(node.name,s.value);execute(node.handler,local);
        }return;
      }
      default:throw new VppError('Câu lệnh chưa hỗ trợ: '+node.type,node.loc);
    }
  }
  try{
    execute(ast,global);
    if(global.values.has('chính'))call(global.values.get('chính'),[],{line:1,column:1});
  }catch(e){
    if(e instanceof Signal){if(e.type==='userthrow')throw new VppError('Ngoại lệ chưa được bắt: '+stringify(e.value));throw new VppError('Lệnh điều khiển nằm ngoài cấu trúc phù hợp.');}
    throw e;
  }
  return {output:lines.join('\n'),lines,steps,variables:[...global.values].filter(([,v])=>v?.kind!=='native').map(([name,value])=>({name,value:stringify(value)}))};
}
