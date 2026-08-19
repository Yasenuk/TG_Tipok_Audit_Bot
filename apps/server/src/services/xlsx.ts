import ExcelJS from 'exceljs';

// TODO: аркуш на точку, блок пунктів + підсумковий рядок
export async function buildWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Store Audit Bot';
  return workbook;
}
