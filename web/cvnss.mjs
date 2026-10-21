/** Bridges V++ source keywords with CVNSS4.0 without touching user data in strings/comments.
 * Converter is loaded separately from the supplied v5 audit-safe edition.
 */
export const RESERVED=['hàm','in','nếu','hoặc','lặp','trả','về','đúng','sai','rỗng','thoát','bỏ','qua','thử','bắt','lỗi','ném','chọn','ca','mặc','định'];
const isWord = c=>/[\p{L}\p{M}\p{N}_]/u.test(c||'');
export function bridge(converter){
  if(!converter || !converter.selfTest || !converter.audit)throw new Error('Thiếu CVNSSConverter v5 audit-safe.');
  const audit=converter.audit();const selfTest=converter.selfTest();
  if(!selfTest.ok || audit.ambiguityGroups!==56 || audit.criticalCollisionGroups!==5 || audit.silentReverseOverwrite!==0)
    throw new Error('Bộ chuyển đổi CVNSS4.0 chưa vượt qua kiểm tra dữ liệu.');
  const enc=new Map(),dec=new Map(),warnings=[];
  for(const word of RESERVED){
    const code=converter.fromCqn(word).cvss.toLowerCase().normalize('NFC');
    if(!code || !/^[a-z]+$/.test(code)){warnings.push(`Không tạo alias cho '${word}'.`);continue;}
    if(dec.has(code)&&dec.get(code)!==word){warnings.push(`Xung đột alias '${code}' giữa '${word}' và '${dec.get(code)}'.`);dec.delete(code);continue;}
    dec.set(code,word);enc.set(word,code);
  }
  // User identifiers (including the entry point 'chính') are never rewritten.
  function transform(source,mode){
    const s=String(source).normalize('NFC');let out='',i=0;
    while(i<s.length){
      if(s.startsWith('//',i)){const j=s.indexOf('\n',i);const end=j<0?s.length:j;out+=s.slice(i,end);i=end;continue;}
      if(s.startsWith('/*',i)){const j=s.indexOf('*/',i+2);const end=j<0?s.length:j+2;out+=s.slice(i,end);i=end;continue;}
      const c=s[i];
      if(c==='"'||c==="'"){
        const quote=c;let j=i+1;
        while(j<s.length){if(s[j]==='\\'){j+=2;continue;}if(s[j++]===quote)break;}
        out+=s.slice(i,j);i=j;continue;
      }
      if(mode==='toVPP' && c==='@' && isWord(s[i+1])){
        let j=i+2;while(j<s.length&&isWord(s[j]))j++;
        const alias=s.slice(i+1,j);
        if(dec.has(alias)){out+=dec.get(alias);i=j;continue;}
      }
      if(isWord(c)){
        let j=i+1;while(j<s.length&&isWord(s[j]))j++;
        const w=s.slice(i,j);
        const alias=mode==='toCVNSS'?enc.get(w):null;
        out+=alias?'@'+alias:w;i=j;continue;
      }
      out+=c;i++;
    }
    return out;
  }
  return Object.freeze({audit,selfTest,warnings,encodeKeywords:s=>transform(s,'toCVNSS'),decodeKeywords:s=>transform(s,'toVPP'),dictionary:[...enc].map(([source,cvnss])=>({source,cvnss})),converter});
}
