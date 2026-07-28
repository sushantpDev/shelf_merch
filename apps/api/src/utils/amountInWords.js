const BELOW_20 = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return BELOW_20[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return `${TENS[t]}${u ? ` ${BELOW_20[u]}` : ''}`.trim();
}

function threeDigits(n) {
  if (!n) return '';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const head = h ? `${BELOW_20[h]} Hundred` : '';
  const tail = rest ? twoDigits(rest) : '';
  if (head && tail) return `${head} ${tail}`;
  return head || tail;
}

function indianNumberWords(n) {
  if (!n) return 'Zero';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;
  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(' ');
}

/** Whole rupees in words — e.g. "Thirty Four Thousand Eight Hundred Sixty Rupees". */
export function amountInWordsInr(amount) {
  const rupees = Math.round(Number(amount) || 0);
  return `${indianNumberWords(rupees)} Rupees`;
}
