import fs from "fs";

const zoneId = "bd131177db6d610b5d4e5beb0142108b";
const raw = fs.readFileSync("J:\\My Drive\\CLIENTS\\Cloudflare.txt", "utf8");
const match = raw.match(/cfat_[A-Za-z0-9_-]+/);
const token = match ? match[0] : "";

async function manageDNS() {
  console.log("Using token:", token.slice(0, 10) + "...");
  console.log("Fetching current MX records...");
  const res = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records?type=MX", {
    headers: { Authorization: "Bearer " + token }
  });
  const data = await res.json();
  console.log("Current MX Records response:", JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error("Failed to fetch DNS records:", data.errors);
    return;
  }

  for (const record of data.result) {
    console.log("Deleting old MX record: " + record.name + " -> " + record.content + " (Priority: " + record.priority + ")...");
    const delRes = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records/" + record.id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    });
    const delData = await delRes.json();
    console.log("Deleted " + record.id + ":", delData.success);
  }

  console.log("Adding mx1.hostinger.com (Priority 5)...");
  const add1 = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "MX",
      name: "surokkha.store",
      content: "mx1.hostinger.com",
      priority: 5,
      ttl: 14400
    })
  });
  const data1 = await add1.json();
  console.log("Added mx1.hostinger.com:", data1.success, data1.errors || "");

  console.log("Adding mx2.hostinger.com (Priority 10)...");
  const add2 = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "MX",
      name: "surokkha.store",
      content: "mx2.hostinger.com",
      priority: 10,
      ttl: 14400
    })
  });
  const data2 = await add2.json();
  console.log("Added mx2.hostinger.com:", data2.success, data2.errors || "");

  console.log("\nFetching current TXT records for SPF...");
  const txtRes = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records?type=TXT", {
    headers: { Authorization: "Bearer " + token }
  });
  const txtData = await txtRes.json();
  
  for (const record of txtData.result) {
    if (record.content.includes("v=spf1")) {
      console.log("Deleting old SPF record: " + record.content + "...");
      await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records/" + record.id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
    }
  }

  console.log("Adding Hostinger SPF record...");
  const spfRes = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "TXT",
      name: "surokkha.store",
      content: "v=spf1 include:_spf.mail.hostinger.com ~all",
      ttl: 14400
    })
  });
  const spfData = await spfRes.json();
  console.log("Added SPF:", spfData.success, spfData.errors || "");

  console.log("Adding DKIM CNAME records...");
  const dkimRecords = [
    { name: "hostingermail-a._domainkey", content: "hostingermail-a.dkim.mail.hostinger.com" },
    { name: "hostingermail-b._domainkey", content: "hostingermail-b.dkim.mail.hostinger.com" },
    { name: "hostingermail-c._domainkey", content: "hostingermail-c.dkim.mail.hostinger.com" }
  ];

  for (const rec of dkimRecords) {
    console.log("Adding DKIM: " + rec.name);
    const dRes = await fetch("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "CNAME",
        name: rec.name,
        content: rec.content,
        ttl: 14400,
        proxied: false
      })
    });
    const dData = await dRes.json();
    console.log("Added DKIM " + rec.name + ":", dData.success, dData.errors || "");
  }
}

manageDNS();
