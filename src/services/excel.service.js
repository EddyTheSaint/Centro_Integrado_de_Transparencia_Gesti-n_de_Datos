import XLSX from "xlsx";

export function leerPrimerHoja(buffer){
  const workbook=XLSX.read(buffer,{type:"buffer",cellDates:true});
  const hojaNombre=workbook.SheetNames[0];
  if(!hojaNombre) throw new Error("El archivo no contiene hojas.");
  const sheet=workbook.Sheets[hojaNombre];
  const filas=XLSX.utils.sheet_to_json(sheet,{defval:null,raw:false});
  const matriz=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,raw:false});
  const headers=(matriz[0]||[]).map(v=>String(v??"").trim()).filter(Boolean);
  return {hojaNombre,headers,filas};
}

export function crearExcelBuffer(filas, hojaNombre="Datos"){
  const workbook=XLSX.utils.book_new();
  const sheet=XLSX.utils.json_to_sheet(filas);
  XLSX.utils.book_append_sheet(workbook,sheet,hojaNombre);
  return XLSX.write(workbook,{bookType:"xlsx",type:"buffer"});
}

export function crearExcelMultiHojaBuffer(hojas){
  const workbook=XLSX.utils.book_new();
  for(const hoja of hojas){
    const sheet=XLSX.utils.json_to_sheet(hoja.filas||[]);
    XLSX.utils.book_append_sheet(workbook,sheet,hoja.nombre);
  }
  return XLSX.write(workbook,{bookType:"xlsx",type:"buffer"});
}
