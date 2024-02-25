/* globals chrome, alert, Papa */

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.method === 'POST' && details.requestBody) {
      let payload;
      if (details?.requestBody?.raw) {
        const decoder = new TextDecoder('utf-8');
        payload = decoder.decode(details.requestBody.raw?.[0]?.bytes);
      } else if (details?.requestBody?.formData) {
        payload = JSON.stringify(details.requestBody.formData);
      }

      if (!payload) {
        return alert('Was not able to extract request payload to get CSV data');
      }

      // Parse JSON
      const jsonData = JSON.parse(payload);

      // Prepare CSVs
      const sites = Papa.unparse({
        fields: ['', 'ID', 'Latitudine (°)', 'Longitudine (°)', 'Distanza (m)'],
        data: [
          ['Sito 1', ...getPuntoVicino(jsonData.PuntoSismico.PuntoVicino1)], // notice, large V
          ['Sito 2', ...getPuntoVicino(jsonData.PuntoSismico.Puntovicino2)], // notice, small v :facepalm:
          ['Sito 3', ...getPuntoVicino(jsonData.PuntoSismico.PuntoVicino3)],
          ['Sito 4', ...getPuntoVicino(jsonData.PuntoSismico.Puntovicino4)]
        ]
      });

      const seismicParams = Papa.unparse({
        fields: ['', 'Prob. superamento (%)', 'Tr (anni)', 'ag (g)', 'Fo (-)', 'Tc (s)'],
        data: [
          ['Operatività (SLO)', ...getSeismicParams(jsonData.PuntoSismico.SLO)],
          ['Danno (SLD)', ...getSeismicParams(jsonData.PuntoSismico.SLD)],
          ['Salvaguardia (SLV)', ...getSeismicParams(jsonData.PuntoSismico.SLV)],
          ['Prevenzione dal collasso (SLC)', ...getSeismicParams(jsonData.PuntoSismico.SLC)]
        ]
      });

      const seismicCoefficients = Papa.unparse({
        fields: ['', 'Ss', 'Cc', 'St', 'Kh', 'Kv', 'Amax (m/s²)', 'Beta'],
        data: [
          getSeismicCoefficients(jsonData.ParametriSismici, 'SLO'),
          getSeismicCoefficients(jsonData.ParametriSismici, 'SLD'),
          getSeismicCoefficients(jsonData.ParametriSismici, 'SLV'),
          getSeismicCoefficients(jsonData.ParametriSismici, 'SLC')
        ]
      });

      // Download CSVs (not needed anymore, just print them in a new tab)
      // downloadCsv(sites, 'siti.csv');
      // downloadCsv(seismicParams, 'parametri.csv');
      // downloadCsv(seismicCoefficients, 'coefficienti.csv');

      const finalText = `
Siti di riferimento:
${sites}

Parametri sismici:
${seismicParams}

Categoria sottosuolo: ${jsonData.ParametriSismici.CategoriaSuolo}
Categoria topografica: ${jsonData.ParametriSismici.Categoriatopografica}
Periodo di riferimento: ${jsonData.Idvn}
Coefficiente cu: ${jsonData.PuntoSismico.Cu}

Coefficienti sismici:
${seismicCoefficients}`;

      // Print additional parameters
      chrome.tabs.create({
        url: 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(unescape(finalText))
      });
    }
  },
  { urls: ['*://geoapp.eu/parametrisismici2018/Home/GeneraReportTXT*'] },
  ['blocking', 'requestBody']
);

function round (num, digits = 2) {
  return Math.round(num * 10 ** digits) / 10 ** digits;
}

function getPuntoVicino (data) {
  const id = data.ID;
  const lat = data.Latitudine;
  const lon = data.Longitudine;
  const distance = data.Dist_Da_P;
  return [id, round(lat, 4), round(lon, 4), round(distance, 0)];
}

function getSeismicParams (data) {
  return [
    round(data.Pvr * 100, 0),
    round(data.Tr, 0),
    round(data.Ag, 3),
    round(data.F0, 3),
    round(data.Tc_star, 3)
  ];
}

function getSeismicCoefficients (data, type) {
  return [
    type,
    round(data[type + '_Ss'], 3),
    round(data[type + '_Cc'], 3),
    round(data[type + '_St'], 3),
    round(data[type + '_Kh'], 3),
    round(data[type + '_Kv'], 3),
    round(data[type + '_Amax'], 3),
    round(data[type + '_Beta'], 3)
  ];
}

// function downloadCsv (data, filename) {
//   const blob = new Blob([data], { type: 'text/csv' });
//   const url = URL.createObjectURL(blob);
//   chrome.downloads.download({
//     url,
//     filename
//   });
// }
