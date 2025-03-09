const convertHexToHTML = (hexString) => {
  if (!hexString) return '';
  
  return hexString.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
    const val = parseInt(hex, 16);
    return String.fromCharCode(val);
  });
};

const decodeHTMLEntities = (encodedString) => {
  if (!encodedString) return ''
  
  const htmlEntities = {
    'lt': '<',
    'gt': '>',
    'amp': '&',
    'quot': '"',
    'apos': "'"
  };
  
  return encodedString.replace(/&#(\d+);|&#[xX]([A-Fa-f0-9]+);|&([^;]+);/g, (match, dec, hex, entity) => {
    if (dec) {
      return String.fromCharCode(parseInt(dec, 10));
    } else if (hex) {
      return String.fromCharCode(parseInt(hex, 16));
    } else if (htmlEntities[entity]) {
      return htmlEntities[entity];
    }
    return match;
  });
};

// This function is critical for proper authentication
const extractCookies = (cookieStr) => {
  if (!cookieStr) return '';
  
  // Extract the important authentication cookies
  const iamadt = getCookie(cookieStr, '_iamadt_client_10002227248');
  const iambdt = getCookie(cookieStr, '_iambdt_client_10002227248');
  
  // Return both cookies to maintain session
  if (iamadt && iambdt) {
    return `_iamadt_client_10002227248=${iamadt}; _iambdt_client_10002227248=${iambdt}; ZCNEWUIPUBLICPORTAL=true; cli_rgn=IN;`;
  } else {
    // Try to maintain the original cookie string if specific cookies aren't found
    return cookieStr;
  }
};

const getCookie = (cookieStr, name) => {
  if (!cookieStr) return '';
  const match = cookieStr.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : '';
};

module.exports = {
  convertHexToHTML,
  decodeHTMLEntities,
  extractCookies,
  getCookie
};