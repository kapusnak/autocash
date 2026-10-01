import { buildLeadEmails, operatorNotifySubject } from "../lib/lead-email"

const cases = [
  operatorNotifySubject({
    domainTag: "autocash.cz",
    callback: false,
    name: "Jan Novák",
    phoneDisplay: "+420 776 123 456",
  }),
  operatorNotifySubject({
    domainTag: "autocash.cz",
    callback: false,
    name: "---",
    phoneDisplay: "+420 776 123 456",
  }),
  operatorNotifySubject({
    domainTag: "autocash.cz",
    callback: true,
    name: "---",
    phoneDisplay: "+420 776 123 456",
  }),
]

const calculator = buildLeadEmails({
  source: "calculator",
  phone: "+420 776 123 456",
  email: "jan@example.com",
  name: "Jan Novák",
  amount: 180000,
  vehicleModel: "Škoda Fabia",
  vehicleYear: "2018",
  vehicleMileage: "120000",
  ip: "1.2.3.4",
})

const expected = [
  "[autocash.cz] Jan Novák – Nová poptávka",
  "[autocash.cz] +420 776 123 456 – Nová poptávka",
  "[autocash.cz] Callback – +420 776 123 456",
]

for (let i = 0; i < cases.length; i++) {
  if (cases[i] !== expected[i]) {
    throw new Error(`Subject mismatch ${i}: ${cases[i]} !== ${expected[i]}`)
  }
}

if (calculator.notifySubject !== expected[0]) {
  throw new Error(`buildLeadEmails subject: ${calculator.notifySubject}`)
}

if (!calculator.notifyHtml.includes("AUTOCASH — NOVÁ POPTÁVKA — Jan Novák")) {
  throw new Error("Operator HTML heading is missing the client name")
}

if (!calculator.notifyHtml.includes("Jan Novák")) {
  throw new Error("Operator HTML body is missing the client name")
}

const withPhotos = buildLeadEmails({
  source: "calculator",
  phone: "+420 776 123 456",
  email: "jan@example.com",
  name: "Jan Novák",
  amount: 180000,
  vehicleModel: "Škoda Fabia",
  vehicleYear: "2018",
  vehicleMileage: "120000",
  ip: "1.2.3.4",
  photoUrl: "https://autocash.cz/fotky/token",
  photoCode: "AC-TEST",
})

if (!withPhotos.clientText.includes("9 fotek vozu")) {
  throw new Error(`Client text is missing the photo count: ${withPhotos.clientText}`)
}
if (!withPhotos.clientText.includes("interiér přední části")) {
  throw new Error("Client text is missing the front interior angle")
}
if (!withPhotos.clientText.includes("interiér zadní části")) {
  throw new Error("Client text is missing the rear interior angle")
}
if (!withPhotos.clientText.includes("technický průkaz z přední strany")) {
  throw new Error("Client text is missing the technical licence front")
}
if (!withPhotos.clientText.includes("technický průkaz ze zadní strany")) {
  throw new Error("Client text is missing the technical licence back")
}
if (!withPhotos.clientHtml.includes(">9 fotek vozu<") && !withPhotos.clientHtml.includes("9 fotek vozu")) {
  throw new Error("Client HTML is missing the photo count")
}

console.log("ok")
console.log(calculator.notifySubject)
console.log("heading: AUTOCASH — NOVÁ POPTÁVKA — Jan Novák")
