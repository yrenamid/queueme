
// Handles format Peso
export const formatPeso = (value: number | string | null | undefined) => {
  if(value === null || value === undefined || value === '') return '₱0.00';
  const num = typeof value === 'string' ? Number(value) : value;
  if(Number.isNaN(num)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};


// Handles parse Peso Input
export const parsePesoInput = (value: string) => {
  if(!value) return 0;
  const cleaned = value.replace(/[^0-9.]/g,'');
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : Math.round(num * 100) / 100; // clamp to 2 decimals
};
