import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────────────────────
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const day = (v: string) => new Date(`${v}T00:00:00.000+05:30`);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(0,0,0,0); return d; };

// ─── reference data ─────────────────────────────────────────────────────────
const ITEM_DEFS = [
  { code:"RM-007", desc:"Aluminium Frame 30mm Silver", cat:"RAW_MATERIAL", uom:"PCS",  hsn:"76109090", gst:18, rl:2000,  cost:220  },
  { code:"RM-008", desc:"Aluminium Frame 35mm Black",  cat:"RAW_MATERIAL", uom:"PCS",  hsn:"76109090", gst:18, rl:2000,  cost:260  },
  { code:"RM-009", desc:"Backsheet White DuPont 300m", cat:"RAW_MATERIAL", uom:"ROLLS",hsn:"39209990", gst:18, rl:300,   cost:28000 },
  { code:"RM-010", desc:"Backsheet Black KPF 300m",    cat:"RAW_MATERIAL", uom:"ROLLS",hsn:"39209990", gst:18, rl:300,   cost:32000 },
  { code:"RM-011", desc:"MBB Ribbon Wire 0.35mm",      cat:"RAW_MATERIAL", uom:"KG",   hsn:"74081990", gst:18, rl:300,   cost:2800  },
  { code:"RM-012", desc:"Silicone Sealant Black 310ml",cat:"RAW_MATERIAL", uom:"PCS",  hsn:"38249090", gst:18, rl:5000,  cost:85    },
  { code:"RM-013", desc:"Junction Box MC4 IP68",       cat:"RAW_MATERIAL", uom:"PCS",  hsn:"85369090", gst:18, rl:3000,  cost:320   },
  { code:"RM-014", desc:"Solar Cells 210mm TOPCON",    cat:"RAW_MATERIAL", uom:"PCS",  hsn:"85414020", gst:5,  rl:30000, cost:210   },
  { code:"RM-015", desc:"EVA Film Anti-PID Grade",     cat:"RAW_MATERIAL", uom:"ROLLS",hsn:"39201090", gst:18, rl:400,   cost:13500 },
  { code:"RM-016", desc:"Toughened Glass 2.5mm ARC",   cat:"RAW_MATERIAL", uom:"PCS",  hsn:"70071900", gst:18, rl:800,   cost:1100  },
  { code:"RM-017", desc:"Bypass Diode Schottky 15A",   cat:"RAW_MATERIAL", uom:"PCS",  hsn:"85410000", gst:18, rl:10000, cost:12    },
  { code:"RM-018", desc:"Encapsulant POE Film 500m",   cat:"RAW_MATERIAL", uom:"ROLLS",hsn:"39201090", gst:18, rl:200,   cost:18000 },
  { code:"FG-004", desc:"Solar Module 625W TOPCON",    cat:"FINISHED_GOOD",uom:"PCS",  hsn:"85414020", gst:5,  rl:0,     cost:21000 },
  { code:"FG-005", desc:"Solar Module 545W Bifacial",  cat:"FINISHED_GOOD",uom:"PCS",  hsn:"85414020", gst:5,  rl:0,     cost:16500 },
  { code:"FG-006", desc:"Solar Module 550W Half-Cut",  cat:"FINISHED_GOOD",uom:"PCS",  hsn:"85414020", gst:5,  rl:0,     cost:17000 },
  { code:"CON-001",desc:"Nitrogen Gas Cylinder 7m³",   cat:"CONSUMABLE",   uom:"PCS",  hsn:"28043000", gst:18, rl:10,    cost:1200  },
  { code:"CON-002",desc:"Isopropyl Alcohol 99% 5L",    cat:"CONSUMABLE",   uom:"PCS",  hsn:"29051200", gst:18, rl:50,    cost:650   },
  { code:"CON-003",desc:"Laminator Release Paper",     cat:"CONSUMABLE",   uom:"ROLLS",hsn:"48119000", gst:12, rl:100,   cost:2200  },
];

const VENDOR_DEFS = [
  { code:"VND-005", name:"FrameTech Aluminium",      cat:"Aluminium Frame", city:"Rajkot",     gstin:"24AABCF1234A1Z5", otd:91, rat:5 },
  { code:"VND-006", name:"KPF Backsheet India",       cat:"Backsheet",       city:"Hyderabad",  gstin:"36AABCK2345B1Z6", otd:87, rat:4 },
  { code:"VND-007", name:"Aditya Wire Products",      cat:"Ribbon Wire",     city:"Jamnagar",   gstin:"24AABCA3456C1Z7", otd:79, rat:3 },
  { code:"VND-008", name:"SolarBox Components",       cat:"Junction Box",    city:"Noida",      gstin:"09AABCS4567D1Z8", otd:93, rat:5 },
  { code:"VND-009", name:"POE Encapsulants Ltd",      cat:"EVA/POE Film",    city:"Pune",       gstin:"27AABCP5678E1Z9", otd:85, rat:4 },
  { code:"VND-010", name:"TopCon Cells Manufacturing",cat:"Solar Cells",     city:"Chennai",    gstin:"33AABCT6789F1Z0", otd:82, rat:4 },
  { code:"VND-011", name:"Vijay Glass Works",         cat:"Glass",           city:"Firozabad",  gstin:"09AABCV7890G1Z1", otd:94, rat:5 },
  { code:"VND-012", name:"Bharat Silicone Products",  cat:"Silicone",        city:"Ankleshwar", gstin:"24AABCB8901H1Z2", otd:96, rat:5 },
  { code:"VND-013", name:"National Diode Corp",       cat:"Electronics",     city:"Delhi",      gstin:"07AABCN9012I1Z3", otd:88, rat:4 },
  { code:"VND-014", name:"Indo German Chemicals",     cat:"Consumables",     city:"Mumbai",     gstin:"27AABCI0123J1Z4", otd:76, rat:3 },
  { code:"VND-015", name:"Gujarat Frame Industries",  cat:"Aluminium Frame", city:"Ahmedabad",  gstin:"24AABCG1234K1Z5", otd:89, rat:4 },
  { code:"VND-016", name:"EcoBright Film Co",         cat:"Backsheet",       city:"Nagpur",     gstin:"27AABCE2345L1Z6", otd:72, rat:3, status:"UNDER_REVIEW" },
];

const CUSTOMER_DEFS = [
  { code:"CUS-004", name:"Adani Solar EPC",         city:"Ahmedabad",  gstin:"24AABCA1234A1Z5", cl:200000000 },
  { code:"CUS-005", name:"Tata Power Renewables",   city:"Mumbai",     gstin:"27AABCT2345B1Z6", cl:300000000 },
  { code:"CUS-006", name:"Azure Power Infra",        city:"Delhi",      gstin:"07AABCA3456C1Z7", cl:150000000 },
  { code:"CUS-007", name:"Hero Future Energies",     city:"Gurgaon",    gstin:"06AABCH4567D1Z8", cl:100000000 },
  { code:"CUS-008", name:"ReNew Power Ltd",          city:"Gurgaon",    gstin:"06AABCR5678E1Z9", cl:180000000 },
  { code:"CUS-009", name:"Greenko Solar Projects",   city:"Hyderabad",  gstin:"36AABCG6789F1Z0", cl:120000000 },
  { code:"CUS-010", name:"NTPC Renewable Energy",    city:"New Delhi",  gstin:"07AABCN7890G1Z1", cl:500000000 },
  { code:"CUS-011", name:"Torrent Power Solar",      city:"Ahmedabad",  gstin:"24AABCT8901H1Z2", cl:80000000  },
  { code:"CUS-012", name:"Waaree Energies EPC",      city:"Mumbai",     gstin:"27AABCW9012I1Z3", cl:90000000  },
  { code:"CUS-013", name:"Vikram Solar Projects",    city:"Kolkata",    gstin:"19AABCV0123J1Z4", cl:70000000  },
  { code:"CUS-014", name:"Goldi Solar EPC",          city:"Surat",      gstin:"24AABCG1234K1Z5", cl:60000000  },
  { code:"CUS-015", name:"Premier Solar Systems",    city:"Hyderabad",  gstin:"36AABCP2345L1Z6", cl:55000000  },
];

const EMPLOYEE_DEFS = [
  // Manufacturing
  { no:"EMP-101",name:"Suresh Kumar Yadav",     dept:"Manufacturing",role:"Production Operator",  shift:"Morning" },
  { no:"EMP-102",name:"Prakash Sharma",          dept:"Manufacturing",role:"Production Operator",  shift:"Morning" },
  { no:"EMP-103",name:"Dinesh Patel",            dept:"Manufacturing",role:"Line Technician",      shift:"Morning" },
  { no:"EMP-104",name:"Mohan Das",               dept:"Manufacturing",role:"Machine Operator",     shift:"Evening" },
  { no:"EMP-105",name:"Rajesh Singh",            dept:"Manufacturing",role:"Production Operator",  shift:"Evening" },
  { no:"EMP-106",name:"Sanjay Kumar",            dept:"Manufacturing",role:"Line Supervisor",      shift:"General" },
  { no:"EMP-107",name:"Ramesh Verma",            dept:"Manufacturing",role:"Production Technician",shift:"Night"   },
  { no:"EMP-108",name:"Vinod Sharma",            dept:"Manufacturing",role:"Machine Operator",     shift:"Night"   },
  { no:"EMP-109",name:"Deepak Joshi",            dept:"Manufacturing",role:"Production Operator",  shift:"Morning" },
  { no:"EMP-110",name:"Anil Gupta",              dept:"Manufacturing",role:"Line Technician",      shift:"Morning" },
  // Quality
  { no:"EMP-201",name:"Neha Agarwal",            dept:"Quality",      role:"QC Inspector",         shift:"Morning" },
  { no:"EMP-202",name:"Sonal Mehta",             dept:"Quality",      role:"QC Inspector",         shift:"Morning" },
  { no:"EMP-203",name:"Harish Nair",             dept:"Quality",      role:"Flash Test Operator",  shift:"Morning" },
  { no:"EMP-204",name:"Deepika Patel",           dept:"Quality",      role:"IQC Inspector",        shift:"General" },
  { no:"EMP-205",name:"Vijay Bhat",              dept:"Quality",      role:"Quality Engineer",     shift:"General" },
  { no:"EMP-206",name:"Sunita Reddy",            dept:"Quality",      role:"QA Analyst",           shift:"General" },
  // Procurement
  { no:"EMP-301",name:"Kiran Desai",             dept:"Procurement",  role:"Purchase Executive",   shift:"General" },
  { no:"EMP-302",name:"Manish Jain",             dept:"Procurement",  role:"Purchase Executive",   shift:"General" },
  { no:"EMP-303",name:"Preeti Shah",             dept:"Procurement",  role:"Vendor Coordinator",   shift:"General" },
  // Finance
  { no:"EMP-401",name:"Archana Kulkarni",        dept:"Finance",      role:"Accounts Executive",   shift:"General" },
  { no:"EMP-402",name:"Rohan Pandey",            dept:"Finance",      role:"Finance Analyst",      shift:"General" },
  { no:"EMP-403",name:"Seema Gupta",             dept:"Finance",      role:"Billing Executive",    shift:"General" },
  // Sales
  { no:"EMP-501",name:"Varun Malhotra",          dept:"Sales",        role:"Sales Executive",      shift:"General" },
  { no:"EMP-502",name:"Pooja Srivastava",        dept:"Sales",        role:"Sales Coordinator",    shift:"General" },
  { no:"EMP-503",name:"Nikhil Tiwari",           dept:"Sales",        role:"Business Development", shift:"General" },
  // Stores
  { no:"EMP-601",name:"Bhavesh Trivedi",         dept:"Stores",       role:"Stores Incharge",      shift:"General" },
  { no:"EMP-602",name:"Santosh Maurya",          dept:"Stores",       role:"Storekeeper",          shift:"Morning" },
  { no:"EMP-603",name:"Ravi Shankar",            dept:"Stores",       role:"Storekeeper",          shift:"Evening" },
  // HR & Admin
  { no:"EMP-701",name:"Meenakshi Iyer",          dept:"HR",           role:"HR Executive",         shift:"General" },
  { no:"EMP-702",name:"Gaurav Saxena",           dept:"Admin",        role:"Admin Executive",      shift:"General" },
  // IT
  { no:"EMP-801",name:"Aakash Bose",             dept:"IT",           role:"ERP Administrator",    shift:"General" },
];

const LINE_NAMES = ["Line 1","Line 2","Line 3","Line 4","Line 5"];

const ACCOUNTS = [
  { code:"1001", name:"Cash in Hand",          type:"ASSET",     dr:1240000,   cr:0 },
  { code:"1002", name:"Bank — HDFC Current",   type:"ASSET",     dr:107600000, cr:0 },
  { code:"1003", name:"Bank — SBI OD",         type:"ASSET",     dr:35000000,  cr:0 },
  { code:"1100", name:"Accounts Receivable",   type:"ASSET",     dr:38000000,  cr:0 },
  { code:"1200", name:"Raw Material Inventory",type:"ASSET",     dr:64000000,  cr:0 },
  { code:"1201", name:"WIP Inventory",         type:"ASSET",     dr:12000000,  cr:0 },
  { code:"1202", name:"Finished Goods Stock",  type:"ASSET",     dr:58000000,  cr:0 },
  { code:"1300", name:"Prepaid Expenses",      type:"ASSET",     dr:2400000,   cr:0 },
  { code:"1400", name:"Fixed Assets — Plant",  type:"ASSET",     dr:480000000, cr:0 },
  { code:"1401", name:"Acc Depreciation — Plant",type:"ASSET",   dr:0,         cr:86000000 },
  { code:"2001", name:"Accounts Payable",      type:"LIABILITY", dr:0, cr:24000000 },
  { code:"2002", name:"GST Payable",           type:"LIABILITY", dr:0, cr:5600000  },
  { code:"2003", name:"TDS Payable",           type:"LIABILITY", dr:0, cr:1200000  },
  { code:"2004", name:"Salaries Payable",      type:"LIABILITY", dr:0, cr:14800000 },
  { code:"2005", name:"Short-term Loan HDFC",  type:"LIABILITY", dr:0, cr:50000000 },
  { code:"3001", name:"Share Capital",         type:"EQUITY",    dr:0, cr:500000000},
  { code:"3002", name:"Retained Earnings",     type:"EQUITY",    dr:0, cr:84000000 },
  { code:"4001", name:"Revenue — Module Sales",type:"INCOME",    dr:0, cr:680000000},
  { code:"4002", name:"Revenue — Service",     type:"INCOME",    dr:0, cr:8000000  },
  { code:"5001", name:"Raw Material Cost",     type:"EXPENSE",   dr:380000000, cr:0 },
  { code:"5002", name:"Labour Cost",           type:"EXPENSE",   dr:60000000,  cr:0 },
  { code:"5003", name:"Power & Fuel",          type:"EXPENSE",   dr:28000000,  cr:0 },
  { code:"5004", name:"Depreciation",          type:"EXPENSE",   dr:8500000,   cr:0 },
  { code:"5005", name:"Selling & Distribution",type:"EXPENSE",   dr:14000000,  cr:0 },
  { code:"5006", name:"Admin & General Exp",   type:"EXPENSE",   dr:9000000,   cr:0 },
];

async function main() {
  console.log("🌱 Bulk seed starting…");

  // ── 1. ITEMS ───────────────────────────────────────────────────────────────
  console.log("  Items…");
  for (const it of ITEM_DEFS) {
    await prisma.item.upsert({
      where: { code: it.code },
      update: {},
      create: {
        code: it.code, description: it.desc, category: it.cat,
        uom: it.uom as "PCS"|"ROLLS"|"KG"|"METRES"|"LITRES"|"SETS",
        hsnCode: it.hsn, gstRate: it.gst, reorderLevel: it.rl
      }
    });
  }

  // ── 2. VENDORS ─────────────────────────────────────────────────────────────
  console.log("  Vendors…");
  for (const v of VENDOR_DEFS) {
    await prisma.vendor.upsert({
      where: { code: v.code },
      update: {},
      create: {
        code: v.code, name: v.name, category: v.cat, city: v.city,
        gstin: v.gstin, status: (v as any).status || "APPROVED",
        onTimeDelivery: v.otd, rating: v.rat,
        email: `procurement@${v.name.toLowerCase().replace(/\s/g,"-")}.com`,
        phone: `+91-${9000000000 + parseInt(v.code.slice(-3))}`
      }
    });
  }

  // ── 3. CUSTOMERS ───────────────────────────────────────────────────────────
  console.log("  Customers…");
  for (const c of CUSTOMER_DEFS) {
    await prisma.customer.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code, name: c.name, city: c.city,
        gstin: c.gstin, creditLimit: c.cl,
        email: `orders@${c.name.toLowerCase().replace(/\s/g,"-").slice(0,20)}.in`,
        phone: `+91-${9100000000 + parseInt(c.code.slice(-3))}`
      }
    });
  }

  // ── 4. WAREHOUSES ──────────────────────────────────────────────────────────
  console.log("  Warehouses…");
  const whs = ["WH-RM","WH-FG","WH-QH","WH-STG","WH-SCRAP"].map((code,i) => ({
    code, name: ["Raw Material Store","Finished Goods Store","QC Hold Area","Staging Area","Scrap Yard"][i],
    location: "Plant A, Surat SEZ"
  }));
  for (const wh of whs) {
    await prisma.warehouse.upsert({ where:{code:wh.code}, update:{}, create: wh });
  }

  // ── 5. EMPLOYEES ───────────────────────────────────────────────────────────
  console.log("  Employees…");
  for (const e of EMPLOYEE_DEFS) {
    await prisma.employee.upsert({
      where: { empNo: e.no },
      update: {},
      create: {
        empNo: e.no, fullName: e.name, department: e.dept, role: e.role, shift: e.shift,
        email: `${e.name.toLowerCase().replace(/\s/g,".")}@solaros.in`,
        phone: `+91-${8800000000 + parseInt(e.no.slice(-3))}`,
        status: rnd(0,10) > 1 ? "PRESENT" : "ON_LEAVE"
      }
    });
  }

  // ── 6. CHART OF ACCOUNTS ───────────────────────────────────────────────────
  console.log("  Chart of Accounts…");
  for (const a of ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: a.code },
      update: {},
      create: { code: a.code, name: a.name, type: a.type as "ASSET"|"LIABILITY"|"EQUITY"|"INCOME"|"EXPENSE", openingDr: a.dr, openingCr: a.cr }
    });
  }

  // ── get IDs ──────────────────────────────────────────────────────────────
  const allItems    = await prisma.item.findMany({ select:{id:true,code:true,uom:true} });
  const allVendors  = await prisma.vendor.findMany({ select:{id:true,code:true} });
  const allCusts    = await prisma.customer.findMany({ select:{id:true} });
  const allWH       = await prisma.warehouse.findMany({ select:{id:true,code:true} });
  const allEmps     = await prisma.employee.findMany({ select:{id:true,fullName:true} });

  const itemIds   = allItems.map(i => i.id);
  const rmItems   = allItems.filter(i => i.code.startsWith("RM-"));
  const fgItems   = allItems.filter(i => i.code.startsWith("FG-"));
  const vendorIds = allVendors.map(v => v.id);
  const custIds   = allCusts.map(c => c.id);
  const wh_rm     = allWH.find(w => w.code === "WH-RM")!;
  const wh_fg     = allWH.find(w => w.code === "WH-FG")!;
  const wh_qh     = allWH.find(w => w.code === "WH-QH")!;

  // ── 7. STOCK BATCHES ───────────────────────────────────────────────────────
  console.log("  Stock batches…");
  const BATCH_DATA = [
    ...rmItems.map((it, i) => ({
      itemId: it.id, warehouseId: wh_rm.id, batchNo: `B-${900+i}`,
      quantity: rnd(500, 50000), unitCost: rnd(80, 30000), status: "AVAILABLE"
    })),
    ...fgItems.map((it, i) => ({
      itemId: it.id, warehouseId: wh_fg.id, batchNo: `FG-${100+i}`,
      quantity: rnd(200, 5000), unitCost: rnd(15000, 22000), status: "AVAILABLE"
    })),
    // Some on hold in QH
    ...rmItems.slice(0,3).map((it, i) => ({
      itemId: it.id, warehouseId: wh_qh.id, batchNo: `QH-${100+i}`,
      quantity: rnd(100, 2000), unitCost: rnd(80, 30000), status: "ON_HOLD"
    })),
  ];

  for (const b of BATCH_DATA) {
    try {
      await prisma.stockBatch.upsert({
        where: { itemId_warehouseId_batchNo: { itemId:b.itemId, warehouseId:b.warehouseId, batchNo:b.batchNo } },
        update: {},
        create: { ...b, receivedAt: daysAgo(rnd(1, 120)) }
      });
    } catch(_){}
  }

  // ── 8. PURCHASE ORDERS ─────────────────────────────────────────────────────
  console.log("  Purchase Orders (50)…");
  const STATUSES_PO = ["DRAFT","PENDING_APPROVAL","APPROVED","APPROVED","APPROVED","PARTIALLY_RECEIVED","RECEIVED","CLOSED","CLOSED","CANCELLED"];
  const AI_RISKS = ["Clean","Clean","Clean","Overpriced","Variance watch","New vendor — verify","Clean","Clean","Delivery risk","Clean"];
  const createdPOs: string[] = [];

  for (let i = 1; i <= 50; i++) {
    const vendor = pick(allVendors);
    const item   = pick(rmItems);
    const qty    = rnd(500, 20000);
    const price  = rnd(80, 30000);
    const sub    = qty * price;
    const tax    = Math.round(sub * 0.12);
    const total  = sub + tax;
    const poDate = daysAgo(rnd(5, 180));
    const poNo   = `PO-${3000 + i}`;
    const status = pick(STATUSES_PO);

    try {
      const po = await prisma.purchaseOrder.upsert({
        where: { poNo },
        update: {},
        create: {
          poNo, vendorId: vendor.id, poDate,
          deliveryDate: new Date(poDate.getTime() + rnd(14,45)*86400000),
          status, currency:"INR", subtotal:sub, taxAmount:tax, totalAmount:total,
          aiRisk: pick(AI_RISKS),
          lines: { create: [{ itemId:item.id, quantity:qty, unitPrice:price, taxRate:12, lineTotal:sub }] }
        }
      });
      createdPOs.push(po.id);
    } catch(_){}
  }

  const allPOs = await prisma.purchaseOrder.findMany({ where:{status:{in:["APPROVED","PARTIALLY_RECEIVED","RECEIVED"]}}, select:{id:true,vendorId:true} });

  // ── 9. PURCHASE REQUISITIONS ───────────────────────────────────────────────
  console.log("  Purchase Requisitions…");
  for (let i = 1; i <= 25; i++) {
    const item = pick(rmItems);
    const prNo = `PR-${900 + i}`;
    const st   = pick(["DRAFT","PENDING_APPROVAL","APPROVED","APPROVED","APPROVED"]);
    try {
      await prisma.purchaseRequisition.upsert({
        where: { prNo },
        update: {},
        create: {
          prNo, requestedBy: pick(allEmps).fullName,
          requiredBy: daysFromNow(rnd(7, 30)),
          source: pick(["MRP","Manual","Production Plan","Safety Stock"]),
          status: st,
          lines: { create: [{ itemId:item.id, quantity:rnd(100,2000) }] }
        }
      });
    } catch(_){}
  }

  // ── 10. RFQs ───────────────────────────────────────────────────────────────
  console.log("  RFQs…");
  for (let i = 1; i <= 20; i++) {
    const item   = pick(rmItems);
    const vendor = pick(allVendors);
    const rfqNo  = `RFQ-${1100 + i}`;
    try {
      await prisma.rfq.upsert({
        where: { rfqNo },
        update: {},
        create: {
          rfqNo, vendorId:vendor.id, vendorName:(await prisma.vendor.findUnique({where:{id:vendor.id},select:{name:true}}))!.name,
          dueAt: daysFromNow(rnd(3,14)),
          status: pick(["OPEN","OPEN","CLOSED","RECEIVED"]),
          lines: { create:[{ itemId:item.id, quantity:rnd(200,5000), targetRate:rnd(100,20000) }] }
        }
      });
    } catch(_){}
  }

  // ── 11. GRNs ───────────────────────────────────────────────────────────────
  console.log("  GRNs (40)…");
  const createdGRNs: Array<{id:string,vendorId:string,itemId:string}> = [];
  const grnSources = allPOs.slice(0, Math.min(allPOs.length, 40));

  for (let i = 0; i < 40; i++) {
    const src   = grnSources[i % grnSources.length];
    const item  = pick(rmItems);
    const qty   = rnd(500, 15000);
    const grnNo = `GRN-${1300 + i}`;
    const st    = pick(["PENDING_IQC","PENDING_IQC","PASSED","PASSED","FAILED","PARTIALLY_RECEIVED"]);
    const vno   = `MH-${rnd(10,29)} AB ${rnd(1000,9999)}`;
    const lrNo  = `LR-${10000 + i}`;
    try {
      const grn = await prisma.goodsReceipt.upsert({
        where: { grnNo },
        update: {},
        create: {
          grnNo, purchaseOrderId:src.id, vendorId:src.vendorId,
          receivedAt: daysAgo(rnd(1, 60)),
          status: st, vehicleNo: vno, lrNo,
          lines: { create:[{ itemId:item.id, batchNo:`B-GRN-${1300+i}`, quantity:qty, acceptedQty:st==="FAILED"?0:qty, rejectedQty:st==="FAILED"?qty:0 }] }
        }
      });
      createdGRNs.push({ id:grn.id, vendorId:src.vendorId, itemId:item.id });
    } catch(_){}
  }

  const allGRNs = await prisma.goodsReceipt.findMany({ select:{id:true,vendorId:true}, orderBy:{createdAt:"desc"} });

  // ── 12. IQC ────────────────────────────────────────────────────────────────
  console.log("  IQC Inspections (60)…");
  const inspectors = ["Priya Sharma","Neha Agarwal","Harish Nair","Deepika Patel","Vijay Bhat"];
  const IQC_RESULTS = ["PENDING","PENDING","PASS","PASS","PASS","PASS","CONDITIONAL_PASS","FAIL"];
  const createdIQCs: Array<{id:string,result:string}> = [];

  for (let i = 0; i < 60; i++) {
    const grn    = pick(allGRNs);
    const item   = pick(rmItems);
    const result = pick(IQC_RESULTS);
    const iqcNo  = `IQC-${500 + i}`;
    try {
      const iqc = await prisma.iqcInspection.upsert({
        where: { iqcNo },
        update: {},
        create: {
          iqcNo, goodsReceiptId:grn.id, itemId:item.id, vendorId:grn.vendorId,
          inspector: pick(inspectors),
          quantity: rnd(500, 15000),
          result,
          remarks: result==="FAIL" ? "EL test failed — microcrack >3% — reject batch" :
                   result==="CONDITIONAL_PASS" ? "Minor cosmetic defects — accepted under deviation" :
                   result==="PASS" ? "All parameters within specification" : null,
          inspectedAt: result !== "PENDING" ? daysAgo(rnd(1,50)) : null
        }
      });
      createdIQCs.push({ id:iqc.id, result });
    } catch(_){}
  }

  // ── 13. NCR ────────────────────────────────────────────────────────────────
  console.log("  NCRs…");
  const failedIQCs = createdIQCs.filter(i => i.result === "FAIL");
  for (let i = 0; i < Math.min(failedIQCs.length, 12); i++) {
    const ncrNo = `NCR-${300 + i}`;
    try {
      await prisma.ncr.upsert({
        where: { ncrNo },
        update: {},
        create: {
          ncrNo, iqcInspectionId: failedIQCs[i].id,
          severity: pick(["HIGH","HIGH","MEDIUM","CRITICAL"]),
          description: pick([
            "Microcrack detection >3% via EL imaging — batch rejected",
            "Bow deviation >3mm — structural defect",
            "EVA delamination risk on corner seal",
            "Power output below 590W — binning failure",
            "Backsheet pinhole defect on 2.1% of sample",
            "Surface contamination — glass particles detected",
          ]),
          disposition: pick(["Vendor Return","Rework","Scrap","Accept Under Deviation","Hold for Decision"]),
          status: pick(["OPEN","IN_PROGRESS","CLOSED","OPEN"])
        }
      });
    } catch(_){}
  }

  // ── 14. FQC / FLASH TEST ───────────────────────────────────────────────────
  console.log("  FQC Flash Test Records (300)…");
  const fgItemIds = fgItems.map(i=>i.id);
  const FQC_RESULTS_DIST = ["PASS","PASS","PASS","PASS","PASS","PASS","CONDITIONAL_PASS","FAIL"];

  const fqcData = Array.from({length:300}, (_,i) => ({
    fqcNo: `FQC-${5000+i}`,
    itemId: pick(fgItemIds),
    serialNo: `MOD-2025${String(5000+i).padStart(5,"0")}`,
    productionOrderNo: `PRD-${4400 + Math.floor(i/10)}`,
    flashPowerWatts: 595 + rnd(-8, 15) + Math.random() * 2,
    result: pick(FQC_RESULTS_DIST),
    inspectedAt: daysAgo(rnd(0, 60))
  }));

  for (const f of fqcData) {
    try {
      await prisma.fqcInspection.upsert({
        where: { fqcNo: f.fqcNo },
        update: {},
        create: { ...f, flashPowerWatts: parseFloat(f.flashPowerWatts.toFixed(1)),
          remarks: f.result === "FAIL" ? "Flash power below 590W minimum threshold" : null }
      });
    } catch(_){}
  }

  // ── 15. VENDOR INVOICES ────────────────────────────────────────────────────
  console.log("  Vendor Invoices…");
  const PAY_STATUSES = ["PENDING","PENDING","PAID","PAID","PARTIAL","OVERDUE"];
  for (let i = 0; i < 35; i++) {
    const po     = pick(allPOs);
    const vInvNo = `VINV-${3000 + i}`;
    const amount = rnd(200000, 5000000);
    const payStatus = pick(PAY_STATUSES);
    try {
      await prisma.vendorInvoice.upsert({
        where: { vendorId_invoiceNo: { vendorId:po.vendorId, invoiceNo:vInvNo } },
        update: {},
        create: {
          invoiceNo: vInvNo, vendorId: po.vendorId, purchaseOrderId: po.id,
          invoiceDate: daysAgo(rnd(5, 60)),
          amount, varianceAmount: pick([0,0,0,rnd(1000,50000),-rnd(1000,30000)]),
          matchStatus: pick(["3WAY_MATCH","2WAY_MATCH","VARIANCE","PENDING"]),
          paymentStatus: payStatus
        }
      });
    } catch(_){}
  }

  // ── 16. AP PAYMENTS ────────────────────────────────────────────────────────
  console.log("  AP Payments…");
  const allVInvoices = await prisma.vendorInvoice.findMany({ where:{paymentStatus:"PAID"}, select:{id:true,vendorId:true,amount:true}, take:30 });
  for (let i = 0; i < 25; i++) {
    const inv = allVInvoices[i % allVInvoices.length];
    if (!inv) continue;
    const payNo = `PAY-AP-${2000+i}`;
    try {
      await prisma.apPayment.upsert({
        where: { paymentNo: payNo },
        update: {},
        create: {
          paymentNo: payNo, vendorId: inv.vendorId, vendorInvoiceId: inv.id,
          paymentDate: daysAgo(rnd(1, 45)),
          amount: Number(inv.amount),
          mode: pick(["NEFT","RTGS","NEFT","RTGS","IMPS"]),
          bankReference: `UTR${Date.now()}${i}`.slice(0,22),
          status: "PAID"
        }
      });
    } catch(_){}
  }

  // ── 17. SUPPLIER SCORECARDS ────────────────────────────────────────────────
  console.log("  Supplier Scorecards…");
  const periods = ["Apr 2025","Mar 2025","Feb 2025","Jan 2025","Dec 2024","Nov 2024"];
  for (const v of allVendors) {
    for (const period of periods.slice(0,3)) {
      try {
        await prisma.supplierScorecard.create({
          data: { vendorId:v.id, period, qualityScore:rnd(70,100), deliveryScore:rnd(65,98), costScore:rnd(75,95) }
        }).catch(()=>{});
      } catch(_){}
    }
  }

  // ── 18. PRODUCTION ORDERS ──────────────────────────────────────────────────
  console.log("  Production Orders (30)…");
  const PROD_STATUSES = ["PLANNED","RELEASED","IN_PROGRESS","IN_PROGRESS","COMPLETED","COMPLETED","ON_HOLD","CANCELLED"];
  const createdProdOrders: Array<{id:string,orderNo:string}> = [];

  for (let i = 1; i <= 30; i++) {
    const item    = pick(fgItems);
    const planned = rnd(800, 4000);
    const status  = pick(PROD_STATUSES);
    const produced= status==="COMPLETED" ? planned : status==="IN_PROGRESS" ? rnd(Math.floor(planned*0.3), planned-100) : 0;
    const orderNo = `PRD-${4400+i}`;
    try {
      const po = await prisma.productionOrder.upsert({
        where: { orderNo },
        update: {},
        create: {
          orderNo, itemId:item.id,
          plannedQty: planned, producedQty: produced,
          lineName: pick(LINE_NAMES),
          plannedDate: daysAgo(rnd(0, 45)),
          status
        }
      });
      createdProdOrders.push({ id:po.id, orderNo });
    } catch(_){}
  }

  const allProdOrders = await prisma.productionOrder.findMany({ select:{id:true}, take:30 });

  // ── 19. WORK ORDERS ────────────────────────────────────────────────────────
  console.log("  Work Orders…");
  const STATIONS = ["Tabbing & Stringing","Lay-up","Lamination","Framing","Flash Test","EL Testing","Packaging"];
  const WO_STATUSES = ["COMPLETED","COMPLETED","IN_PROGRESS","PLANNED","PLANNED","ON_HOLD"];

  for (let i = 0; i < allProdOrders.length * 4; i++) {
    const prod   = pick(allProdOrders);
    const station= STATIONS[i % STATIONS.length];
    const st     = pick(WO_STATUSES);
    const woNo   = `WO-${9000+i}`;
    try {
      await prisma.workOrder.upsert({
        where: { workOrderNo: woNo },
        update: {},
        create: {
          workOrderNo: woNo, productionOrderId:prod.id, station, status:st,
          assignedTo: pick(allEmps).fullName,
          startedAt: st !== "PLANNED" ? daysAgo(rnd(1,20)) : null,
          completedAt: st === "COMPLETED" ? daysAgo(rnd(0,10)) : null
        }
      });
    } catch(_){}
  }

  // ── 20. OEE LOGS ──────────────────────────────────────────────────────────
  console.log("  OEE Logs (150)…");
  const LINE_BASELINES: Record<string,number> = {
    "Line 1":82, "Line 2":76, "Line 3":61, "Line 4":88, "Line 5":79
  };
  const oeeData = [];
  for (const line of LINE_NAMES) {
    const base = LINE_BASELINES[line];
    for (let d = 0; d < 30; d++) {
      const avail = Math.min(99, base + rnd(-8, 8));
      const perf  = Math.min(99, base + rnd(-6, 10));
      const qual  = Math.min(99.5, 95 + rnd(-3, 4));
      const oee   = parseFloat((avail/100 * perf/100 * qual/100 * 100).toFixed(1));
      oeeData.push({
        lineName: line,
        logDate: daysAgo(d),
        availability: avail, performance: perf, quality: qual, oee,
        downtimeMinutes: oee < 70 ? rnd(30,180) : rnd(0,45),
        notes: oee < 65 ? `${line} downtime — ${pick(["Laminator fault","Stringer jam","Flash tester calibration","Power outage","Tool change"])}` : null
      });
    }
  }
  for (const o of oeeData) {
    try { await prisma.oeeLog.create({ data: o }).catch(()=>{}); } catch(_){}
  }

  // ── 21. SALES ORDERS ──────────────────────────────────────────────────────
  console.log("  Sales Orders (30)…");
  const SO_STATUSES = ["OPEN","OPEN","IN_PROGRESS","IN_PROGRESS","CLOSED","CLOSED","PENDING_APPROVAL","CANCELLED"];
  const createdSOs: Array<{id:string,customerId:string}> = [];

  for (let i = 1; i <= 30; i++) {
    const cust   = pick(allCusts);
    const item   = pick(fgItems);
    const qty    = rnd(500, 8000);
    const price  = rnd(15000, 22000);
    const total  = qty * price;
    const soNo   = `SO-${3400+i}`;
    const status = pick(SO_STATUSES);
    try {
      const so = await prisma.salesOrder.upsert({
        where: { soNo },
        update: {},
        create: {
          soNo, customerId:cust.id, orderDate: daysAgo(rnd(5,90)),
          deliveryDate: daysFromNow(rnd(-20, 30)),
          status, totalAmount:total,
          lines: { create:[{ itemId:item.id, quantity:qty, unitPrice:price, lineTotal:total }] }
        }
      });
      createdSOs.push({ id:so.id, customerId:cust.id });
    } catch(_){}
  }

  // ── 22. DISPATCHES ────────────────────────────────────────────────────────
  console.log("  Dispatches…");
  const allSOs = await prisma.salesOrder.findMany({ select:{id:true,customerId:true}, take:25 });
  const TRANSPORTERS = ["Blue Dart Cargo","TCI Express","Mahindra Logistics","DTDC Freight","Safexpress","VRL Logistics","Shree Tirupati Transport"];
  const allCustsFull = await prisma.customer.findMany({ select:{id:true,name:true} });
  const custNameMap = Object.fromEntries(allCustsFull.map(c => [c.id, c.name]));

  for (let i = 0; i < 25; i++) {
    const so  = pick(allSOs);
    const dspNo = `DSP-${1000+i}`;
    const transporter = pick(TRANSPORTERS);
    const dispatchedAt = daysAgo(rnd(1,45));
    try {
      await prisma.dispatch.upsert({
        where: { dispatchNo: dspNo },
        update: {},
        create: {
          dispatchNo: dspNo, salesOrderId:so.id,
          customerName: custNameMap[so.customerId] || "Customer",
          quantity: rnd(200, 3000), transporter,
          lrNo: `${transporter.substring(0,2).toUpperCase()}-${rnd(100000,999999)}`,
          status: pick(["IN_TRANSIT","IN_TRANSIT","DELIVERED","DELIVERED","CANCELLED"]),
          dispatchedAt,
          deliveredAt: dispatchedAt > daysAgo(10) ? null : new Date(dispatchedAt.getTime() + rnd(2,7)*86400000)
        }
      });
    } catch(_){}
  }

  // ── 23. AR INVOICES ───────────────────────────────────────────────────────
  console.log("  AR Invoices…");
  const AR_STATUSES = ["PENDING","PENDING","PAID","PAID","PARTIAL","OVERDUE"];
  for (let i = 0; i < 30; i++) {
    const so = pick(allSOs);
    const invNo = `INV-${9000+i}`;
    const amount = rnd(1000000, 50000000);
    try {
      await prisma.arInvoice.upsert({
        where: { customerId_invoiceNo: { customerId:so.customerId, invoiceNo:invNo } } as any,
        update: {},
        create: {
          invoiceNo: invNo, customerId:so.customerId, salesOrderId:so.id,
          invoiceDate: daysAgo(rnd(5, 60)),
          amount, status: pick(AR_STATUSES)
        }
      }).catch(async () => {
        await prisma.arInvoice.create({
          data: { invoiceNo:`${invNo}-${i}`, customerId:so.customerId, salesOrderId:so.id,
            invoiceDate:daysAgo(rnd(5,60)), amount, status:pick(AR_STATUSES) }
        }).catch(()=>{});
      });
    } catch(_){}
  }

  // ── 24. AR PAYMENTS ───────────────────────────────────────────────────────
  console.log("  AR Payments…");
  const paidARInvoices = await prisma.arInvoice.findMany({ where:{status:"PAID"}, select:{id:true,customerId:true,amount:true}, take:20 });
  for (let i = 0; i < 20; i++) {
    const inv = paidARInvoices[i % paidARInvoices.length];
    if (!inv) continue;
    const rcptNo = `RCP-${2000+i}`;
    try {
      await prisma.arPayment.upsert({
        where: { receiptNo: rcptNo },
        update: {},
        create: {
          receiptNo: rcptNo, customerId:inv.customerId, arInvoiceId:inv.id,
          receiptDate: daysAgo(rnd(1,30)),
          amount: Number(inv.amount),
          mode: pick(["NEFT","RTGS","NEFT","IMPS"]),
          bankReference: `INFD${Date.now()}${i}`.slice(0,16),
          status: "PAID"
        }
      });
    } catch(_){}
  }

  // ── 25. JOURNAL ENTRIES ───────────────────────────────────────────────────
  console.log("  Journal Entries…");
  const allAccounts = await prisma.account.findMany({ select:{id:true,code:true} });
  const JE_TYPES = ["Purchase","Sales","Payroll","Depreciation","Manual","Tax","Bank Receipt","Bank Payment"];

  for (let i = 0; i < 50; i++) {
    const jeNo = `JE-${5000+i}`;
    const amount = rnd(50000, 5000000);
    const type   = pick(JE_TYPES);
    const posted = rnd(0,3) > 0;
    const drAcct = pick(allAccounts);
    const crAcct = allAccounts.find(a => a.id !== drAcct.id) || allAccounts[0];
    try {
      await prisma.journalEntry.upsert({
        where: { jeNo },
        update: {},
        create: {
          jeNo, entryDate: daysAgo(rnd(0,90)),
          entryType: type,
          description: `${type} — ${["Auto-generated","Month-end accrual","System entry","Manual adjustment","Closing entry"][rnd(0,4)]}`,
          amount, status: posted ? "POSTED" : pick(["DRAFT","PENDING_APPROVAL"]),
          postedBy: posted ? pick(allEmps.map(e=>e.fullName)) : null,
          postedAt:  posted ? daysAgo(rnd(0,5)) : null,
          lines: {
            create: [
              { accountId:drAcct.id, debit:amount, credit:0, memo:`Dr ${drAcct.code}` },
              { accountId:crAcct.id, debit:0, credit:amount, memo:`Cr ${crAcct.code}` }
            ]
          }
        }
      });
    } catch(_){}
  }

  // ── 26. BANK RECONCILIATIONS ──────────────────────────────────────────────
  console.log("  Bank Reconciliations…");
  const months = ["May 2025","Apr 2025","Mar 2025","Feb 2025","Jan 2025","Dec 2024"];
  for (let i = 0; i < months.length; i++) {
    const bank = rnd(90000000, 130000000);
    const book = bank + pick([-2200000,-1500000,0,0,500000,800000]);
    try {
      await prisma.bankReconciliation.create({
        data: {
          reconNo: `RECON-${100+i}`, bankAccount:"HDFC — CA 0012345678",
          statementDate: daysAgo(i * 30),
          bookBalance: book, bankBalance: bank,
          varianceAmount: bank - book,
          status: i > 1 ? "CLOSED" : "OPEN"
        }
      }).catch(()=>{});
    } catch(_){}
  }

  // ── 27. BUDGETS ────────────────────────────────────────────────────────────
  console.log("  Budgets…");
  const DEPTS_BUDGET = ["Manufacturing","Quality","Procurement","Finance","Sales","Admin","HR","IT"];
  const ACCT_CODES   = ["5001","5002","5003","5005","5006"];
  for (const dept of DEPTS_BUDGET) {
    for (const code of ACCT_CODES) {
      const budget = rnd(5000000, 50000000);
      try {
        await prisma.budget.create({
          data: {
            period:"FY 2025-26", department:dept, accountCode:code,
            budgetAmount: budget,
            actualAmount: parseFloat((budget * (0.6 + Math.random() * 0.6)).toFixed(0))
          }
        }).catch(()=>{});
      } catch(_){}
    }
  }

  // ── 28. TAX REPORTS ───────────────────────────────────────────────────────
  console.log("  Tax Reports…");
  const GST_MONTHS = ["Apr 2025","Mar 2025","Feb 2025","Jan 2025","Dec 2024","Nov 2024"];
  for (let i = 0; i < GST_MONTHS.length; i++) {
    const taxable = rnd(40000000, 80000000);
    const taxAmt  = Math.round(taxable * 0.05);
    try {
      await prisma.taxReport.create({
        data: {
          reportNo:`GST-${100+i}`, period:GST_MONTHS[i], reportType:"GSTR-1",
          status: i > 1 ? "POSTED" : "DRAFT",
          taxableValue:taxable, taxAmount:taxAmt,
          filedAt: i > 1 ? daysAgo(i*30) : null
        }
      }).catch(()=>{});
    } catch(_){}
  }

  // ── 29. ATTENDANCE ────────────────────────────────────────────────────────
  console.log("  Attendance (last 20 days × employees)…");
  const ATTN_STATUSES = ["PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","ABSENT","ON_LEAVE"];
  for (const emp of allEmps.slice(0, 35)) {
    for (let d = 0; d < 20; d++) {
      const workDate = daysAgo(d);
      const status   = pick(ATTN_STATUSES);
      const checkIn  = status === "PRESENT" ? new Date(workDate.getTime() + (8*60 + rnd(0,45))*60000) : null;
      const checkOut = checkIn ? new Date(checkIn.getTime() + (8*60 + rnd(-30,90))*60000) : null;
      try {
        await prisma.attendance.create({
          data: { employeeId:emp.id, workDate, status, checkIn, checkOut }
        }).catch(()=>{});
      } catch(_){}
    }
  }

  // ── 30. LEAVE REQUESTS ────────────────────────────────────────────────────
  console.log("  Leave Requests…");
  const LEAVE_TYPES = ["Annual Leave","Sick Leave","Casual Leave","Compensatory Off","Maternity Leave"];
  const LV_STATUSES = ["PENDING","APPROVED","APPROVED","APPROVED","REJECTED"];
  for (let i = 0; i < 25; i++) {
    const emp   = pick(allEmps);
    const from  = daysAgo(rnd(0, 30));
    const to    = new Date(from.getTime() + rnd(0,4)*86400000);
    const st    = pick(LV_STATUSES);
    try {
      await prisma.leaveRequest.create({
        data: {
          employeeId:emp.id, leaveType:pick(LEAVE_TYPES),
          fromDate:from, toDate:to,
          reason: pick(["Personal work","Medical appointment","Family function","Rest","Emergency"]),
          status: st
        }
      }).catch(()=>{});
    } catch(_){}
  }

  // ── 31. PAYROLL RUNS ──────────────────────────────────────────────────────
  console.log("  Payroll Runs…");
  const PAY_MONTHS = ["May 2025","Apr 2025","Mar 2025","Feb 2025","Jan 2025"];
  for (let i = 0; i < PAY_MONTHS.length; i++) {
    const gross = rnd(12000000, 16000000);
    const net   = Math.round(gross * 0.84);
    const payNo = `PRUN-${100+i}`;
    try {
      await prisma.payrollRun.upsert({
        where: { payrollNo: payNo },
        update: {},
        create: {
          payrollNo: payNo, period: PAY_MONTHS[i],
          status: i > 0 ? "COMPLETED" : "DRAFT",
          grossAmount: gross, netAmount: net,
          lines: {
            create: allEmps.slice(0,10).map(e => ({
              employeeId: e.id,
              basicPay: rnd(30000,90000),
              hra: rnd(10000,30000),
              pf: rnd(3600,10800),
              tds: rnd(1000,8000),
              netPay: rnd(35000,85000)
            }))
          }
        }
      });
    } catch(_){}
  }

  // ── 32. RECRUITMENT JOBS ──────────────────────────────────────────────────
  console.log("  Recruitment Jobs…");
  const JOB_DEFS = [
    { no:"JOB-030",title:"Flash Test Operator",       dept:"Quality",      exp:"2-3 years", pri:"High" },
    { no:"JOB-031",title:"Production Supervisor",      dept:"Manufacturing",exp:"5+ years",  pri:"High" },
    { no:"JOB-032",title:"Senior QC Engineer",         dept:"Quality",      exp:"4-6 years", pri:"Medium" },
    { no:"JOB-033",title:"SAP ERP Consultant",         dept:"IT",           exp:"3-5 years", pri:"Medium" },
    { no:"JOB-034",title:"Finance Manager",            dept:"Finance",      exp:"8+ years",  pri:"High" },
    { no:"JOB-035",title:"Sales Executive — Solar EPC",dept:"Sales",        exp:"2-4 years", pri:"Medium" },
    { no:"JOB-036",title:"Maintenance Technician",     dept:"Manufacturing",exp:"3 years",   pri:"Low" },
    { no:"JOB-037",title:"HR Executive",               dept:"HR",           exp:"2-4 years", pri:"Low" },
  ];
  for (const j of JOB_DEFS) {
    try {
      await prisma.recruitmentJob.upsert({
        where: { jobNo: j.no },
        update: {},
        create: { jobNo:j.no, title:j.title, department:j.dept, experience:j.exp, priority:j.pri, status:pick(["OPEN","OPEN","CLOSED","IN_PROGRESS"]) }
      });
    } catch(_){}
  }

  // ── 33. BOM ───────────────────────────────────────────────────────────────
  console.log("  BOMs…");
  const bomDefs = [
    {
      bomNo:"BOM-001", outputCode:"FG-001", version:"v3.2", active:true,
      lines:[
        { code:"RM-001", qty:120,  waste:1.5 },
        { code:"RM-002", qty:1,    waste:0.5 },
        { code:"RM-003", qty:2,    waste:2.0 },
        { code:"RM-009", qty:2,    waste:1.0 },
        { code:"RM-005", qty:0.12, waste:3.0 },
        { code:"RM-013", qty:1,    waste:0   },
        { code:"RM-007", qty:4,    waste:0.5 },
        { code:"RM-012", qty:2,    waste:5.0 },
        { code:"RM-017", qty:3,    waste:0   },
      ]
    },
    {
      bomNo:"BOM-002", outputCode:"FG-004", version:"v1.0", active:true,
      lines:[
        { code:"RM-014", qty:132,  waste:1.5 },
        { code:"RM-016", qty:1,    waste:0.5 },
        { code:"RM-015", qty:2,    waste:2.0 },
        { code:"RM-010", qty:2,    waste:1.0 },
        { code:"RM-011", qty:0.14, waste:3.0 },
        { code:"RM-013", qty:1,    waste:0   },
        { code:"RM-008", qty:4,    waste:0.5 },
      ]
    },
    {
      bomNo:"BOM-003", outputCode:"FG-006", version:"v2.1", active:true,
      lines:[
        { code:"RM-001", qty:108,  waste:1.5 },
        { code:"RM-002", qty:1,    waste:0.5 },
        { code:"RM-018", qty:2,    waste:2.0 },
        { code:"RM-009", qty:2,    waste:1.0 },
        { code:"RM-005", qty:0.10, waste:3.0 },
        { code:"RM-013", qty:1,    waste:0   },
        { code:"RM-007", qty:4,    waste:0.5 },
      ]
    },
  ];

  for (const bom of bomDefs) {
    const outItem = allItems.find(i => i.code === bom.outputCode);
    if (!outItem) continue;
    try {
      await prisma.bom.upsert({
        where: { bomNo: bom.bomNo },
        update: {},
        create: {
          bomNo: bom.bomNo, outputItemId: outItem.id,
          version: bom.version, isActive: bom.active,
          lines: {
            create: bom.lines.map(l => {
              const compItem = allItems.find(i => i.code === l.code);
              return compItem ? { componentItemId:compItem.id, quantity:l.qty, scrapPercent:l.waste } : null;
            }).filter(Boolean) as any
          }
        }
      });
    } catch(_){}
  }

  // ── 34. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log("  Notifications…");
  const adminUser = await prisma.user.findFirst({ where:{role:"ADMIN"} });
  if (adminUser) {
    const NOTIFS = [
      { title:"PO-3020 approved",        message:"₹18.4L PO for SolarTech approved by system.", severity:"SUCCESS" },
      { title:"IQC Failed — Batch QH-002",message:"EL test failed on RM-001 batch. NCR raised automatically.", severity:"ERROR" },
      { title:"EVA Film below reorder",  message:"RM-003 stock 180 rolls vs reorder level 500. Raise PR urgently.", severity:"WARN" },
      { title:"Payroll May 2025 due",    message:"Net payable ₹1.34Cr. Approve payroll run PRUN-100.", severity:"INFO" },
      { title:"SO-3415 overdue",         message:"Green Energy Ltd order delivery 3 days overdue. Dispatch pending.", severity:"ERROR" },
      { title:"IQC Passed — GRN-1320",   message:"10,000 pcs Solar Cells passed incoming quality check.", severity:"SUCCESS" },
      { title:"Line 3 OEE alert",        message:"Line 3 OEE at 61% — maintenance team notified.", severity:"WARN" },
      { title:"GST filing due 10th",     message:"GSTR-1 for Apr 2025 — deadline in 3 days. Pending filing.", severity:"WARN" },
    ];
    for (const n of NOTIFS) {
      try { await prisma.notification.create({ data: { userId:adminUser.id, ...n, isRead:false } }).catch(()=>{}); } catch(_){}
    }
  }

  // ── 35. WAREHOUSE TRANSFERS ───────────────────────────────────────────────
  console.log("  Warehouse Transfers…");
  for (let i = 0; i < 20; i++) {
    const item = pick(rmItems);
    const trfNo = `TRF-${500+i}`;
    try {
      await prisma.warehouseTransfer.upsert({
        where: { transferNo: trfNo },
        update: {},
        create: {
          transferNo: trfNo,
          fromWarehouseId: wh_rm.id, toWarehouseId: wh_fg.id,
          status: pick(["DRAFT","IN_PROGRESS","COMPLETED","COMPLETED"]),
          notes: `Transfer of ${item.code} for production`
        }
      });
    } catch(_){}
  }

  // ── 36. CYCLE COUNTS ──────────────────────────────────────────────────────
  console.log("  Cycle Counts…");
  const allWHall = await prisma.warehouse.findMany({ select:{id:true} });
  for (let i = 0; i < 10; i++) {
    const wh = pick(allWHall);
    const ccNo = `CC-${300+i}`;
    try {
      await prisma.cycleCount.upsert({
        where: { countNo: ccNo },
        update: {},
        create: {
          countNo: ccNo, warehouseId: wh.id,
          countDate: daysAgo(rnd(0,30)),
          status: pick(["DRAFT","IN_PROGRESS","COMPLETED","COMPLETED","APPROVED"]),
          countedBy: pick(allEmps.map(e=>e.fullName)),
          lines: {
            create: rmItems.slice(0,4).map(item => ({
              itemId: item.id,
              systemQty: rnd(1000, 20000),
              countedQty: rnd(950, 20100),
              varianceQty: rnd(-200, 200)
            }))
          }
        }
      });
    } catch(_){}
  }

  // ── 37. STOCK MOVEMENTS ───────────────────────────────────────────────────
  console.log("  Stock Movements (200)…");
  const allBatches = await prisma.stockBatch.findMany({ select:{id:true,itemId:true}, take:50 });
  const MVT_TYPES = ["RECEIPT","ISSUE","ISSUE","ISSUE","ADJUSTMENT","TRANSFER","PRODUCTION_OUTPUT"];

  const movementData = Array.from({length:200}, (_,i) => {
    const batch = pick(allBatches);
    const type  = pick(MVT_TYPES);
    return {
      itemId: batch.itemId, stockBatchId: batch.id,
      movementType: type,
      quantity: rnd(10, 2000),
      toWarehouseId: type === "RECEIPT" ? wh_rm.id : null,
      fromWarehouseId: type === "ISSUE" ? wh_rm.id : null,
      referenceType: pick(["PO","SO","WO","TRANSFER","ADJUSTMENT"]),
      referenceNo: `REF-${10000+i}`,
      notes: null,
      movedAt: daysAgo(rnd(0,60))
    };
  });

  for (const m of movementData) {
    try { await prisma.stockMovement.create({ data: m }).catch(()=>{}); } catch(_){}
  }

  // ── final summary ──────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.item.count(), prisma.vendor.count(), prisma.customer.count(),
    prisma.purchaseOrder.count(), prisma.goodsReceipt.count(), prisma.iqcInspection.count(),
    prisma.fqcInspection.count(), prisma.productionOrder.count(), prisma.oeeLog.count(),
    prisma.salesOrder.count(), prisma.employee.count(), prisma.attendance.count(),
    prisma.journalEntry.count(), prisma.stockBatch.count(), prisma.stockMovement.count(),
  ]);

  const labels = ["Items","Vendors","Customers","POs","GRNs","IQC","FQC","Prod Orders","OEE Logs","Sales Orders","Employees","Attendance","JEs","Stock Batches","Stock Movements"];
  console.log("\n✅ Bulk seed complete. Database totals:");
  labels.forEach((l,i) => console.log(`  ${l.padEnd(18)}: ${counts[i]}`));
  console.log(`\n  Login: admin@solaros.in / password123 / MFA 123456`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
