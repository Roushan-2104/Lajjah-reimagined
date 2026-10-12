// Real catalogue entries (names, metals, prices) taken from lajjha.com product data, Oct 2026.
// `img` ids map to files in public/img (colour) and public/img/depth (Depth Anything V2 maps).

export const archive = [
  { no: '001', name: 'Roop Choker Set', hi: 'रूप', metal: '92.5 Sterling', kind: 'Hallmarked choker', price: 3199, img: 'roop' },
  { no: '002', name: 'Meera Peacock Set', hi: 'मीरा', metal: 'German Silver', kind: 'Choker + studs', price: 1349, img: 'meera' },
  { no: '003', name: 'Ira Crescent Choker', hi: 'इरा', model: 'ira', metal: 'German Silver', kind: 'Hasli choker', price: 1349, img: 'ira' },
  { no: '004', name: 'Kaveri Hasli', hi: 'कावेरी', model: 'kaveri', metal: 'German Silver', kind: 'Hasli + drops', price: 1349, img: 'kaveri' },
  { no: '005', name: 'Anika Peacock Feather', hi: 'अनिका', metal: 'German Silver', kind: 'Choker set', price: 1349, img: 'anika' },
  { no: '006', name: 'Rani Oxidised Choker', hi: 'रानी', metal: 'German Silver', kind: 'Leaf choker set', price: 1349, img: 'rani' },
  { no: '007', name: 'Vira Woven Collar', hi: 'वीरा', metal: 'German Silver + stone', kind: 'Collar set', price: 1349, img: 'vira' },
  { no: '008', name: 'Aara Hammered Torque', hi: 'आरा', metal: 'German Silver', kind: 'Torque', price: 1349, img: 'aara' },
  { no: '009', name: 'Nira Ball-Tip Torque', hi: 'नीरा', model: 'nira', metal: 'German Silver', kind: 'Torque', price: 1349, img: 'nira' },
  { no: '010', name: 'Meera Segmented Collar', hi: 'मीरा', metal: 'German Silver', kind: 'Collar set', price: 1349, img: 'meera-collar' },
  { no: '011', name: 'Aditi Jhumkas', hi: 'अदिति', model: 'aditi', metal: '92.5 Sterling', kind: 'Filigree jhumkas', price: 1999, img: 'aditi' },
]

export const insta = [
  { img: 'ig-vira', caption: 'Vira, on black, in afternoon light' },
  { img: 'ig-rani', caption: 'Leaf set, one rose for scale' },
  { img: 'ig-anika', caption: 'Anika torque, peacock drops' },
  { img: 'ig-bangla', caption: 'A hasli that speaks Bangla' },
  { img: 'ig-noir', caption: 'Stone-set discs on black thread' },
  { img: 'ig-peacock', caption: 'Peacock pendant, cotton cord' },
]

export const inr = n => '₹' + n.toLocaleString('en-IN')

export const IG_URL = 'https://www.instagram.com/lajjhaofficial/'
