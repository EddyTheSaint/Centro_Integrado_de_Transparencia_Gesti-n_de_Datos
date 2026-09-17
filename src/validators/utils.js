export function canon(texto){
  return String(texto??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ").toUpperCase();
}
export function buscarHeader(headers,alternativas){
  const mapa=new Map(headers.map(h=>[canon(h),h]));
  for(const alt of alternativas){ const h=mapa.get(canon(alt)); if(h) return h; }
  return null;
}
