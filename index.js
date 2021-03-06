require('dotenv').config()
require('./logger');
const Util = require('./util');

const multiplier = 1000;

function run() {
    console.log("Getting public IP...");
    Util.getMyIp()
        .then((myIp) => {
            if (myIp) {
                console.log("IP: " + myIp);
                console.log("Finding domain \"" + process.env.DOMAIN_NAME + "\"");
                return [myIp, Util.findDomain(process.env.DOMAIN_NAME)];
            } else
                throw new Error("Unable to get public IP");
        }).spread((myIp, domain) => {
            if (domain) {
                console.log('Domain found');
                console.log('Finding DNS Record "' + process.env.RECORD_NAME + '.' + domain.name + '" (Type: ' + process.env.RECORD_TYPE + ')');
                return [myIp, domain, Util.findDomainRecord(domain.name, process.env.RECORD_TYPE, process.env.RECORD_NAME)];
            } else {
                throw new Error("Unable to find domain");
            }
        }).spread((myIp, domain, dnsRecord) => {
            if (dnsRecord) {
                console.log('DNS Record found');
                if (dnsRecord.data != myIp) {
                    console.log('Updating DNS "' + dnsRecord.name + '.' + domain.name + '" to "' + myIp + '"');
                    return [myIp, domain, dnsRecord, Util.updateDomainRecord(domain.name, dnsRecord.id, { data: myIp })];
                } else
                    return [myIp, domain, dnsRecord, -1]
            } else
                throw new Error("Unable to find DNS Record");
        }).spread((myIp, domain, dnsRecord, updated) => {
            if (updated == -1)
                console.log("Nothing to do. Update is not necessary.");
            else
                console.log('DNS record updated: "' + dnsRecord.name + '.' + domain.name + '" => "' + updated.data + '"');
            setTimeout(run, process.env.INTERVAL * multiplier);
        })
        .catch((e) => {
            console.error(e);
            setTimeout(run, process.env.INTERVAL * multiplier);
        });
}

run();