const axios = require('axios');
const yargs = require('yargs');
const Table = require('cli-table3');
const bffData = require('./data/bff_db.json');
const dns = require('dns');
const util = require('util');

function stripHttps(url) {
  return url.replace(/^https?:\/\//, '');
}

const dnsLookup = util.promisify(dns.lookup);

const argv = yargs
  .option('list', {
    alias: 'l',
    description: 'List all available brands',
    type: 'boolean',
  })
  .option('assess', {
    alias: 'a',
    description: 'Assess a specific brand',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv;

async function getVersion(url) {
  try {
    const response = await axios.get(`${url}/api/v3/version`);
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

async function getIpAddress(hostname) {
  try {
    const { address } = await dnsLookup(hostname);
    return address;
  } catch (error) {
    return 'N/A';
  }
}

async function assessBrand(brandName) {
  const brand = bffData.brands[brandName];
  if (!brand) {
    console.log(`Brand "${brandName}" not found.`);
    return;
  }

  console.log(`\nAssessing brand: ${brand.name} (${brandName})`);

  const table = new Table({
    head: ['Host ID', 'URL', 'IP Address', 'Release Version', 'Config'],
    colWidths: [13, 35, 16, 28, 10],
  });

  for (const [hostId, url] of Object.entries(brand.host)) {
    const versionInfo = await getVersion(url);
    const hostname = new URL(url).hostname;
    const ipAddress = await getIpAddress(hostname);
    table.push([
      hostId,
      stripHttps(url),
      ipAddress,
      versionInfo.releaseVersion || 'N/A',
      versionInfo.configVersion || 'N/A',
    ]);
  }

  console.log(table.toString());
}

if (argv.list) {
  console.log('Available brands:');
  Object.entries(bffData.brands).forEach(([identifier, brand]) => {
    console.log(`- ${brand.name} (${identifier})`);
  });
} else if (argv.assess) {
  assessBrand(argv.assess);
} else {
  console.log('Please use --list to see available brands or --assess <brand> to assess a specific brand.');
}
