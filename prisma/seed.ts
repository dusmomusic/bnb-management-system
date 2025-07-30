import { PrismaClient, Role, UnitType, RecurrenceType, InquiryStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Crea utente Admin
  const adminPassword = await bcrypt.hash('change-me', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Crea utente Staff
  const staffPassword = await bcrypt.hash('staff-password', 10);
  await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@example.com',
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  // Crea utente Viewer
  const viewerPassword = await bcrypt.hash('viewer-password', 10);
  await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: viewerPassword,
      role: Role.VIEWER,
    },
  });

  // Crea proprietà 1
  const property1 = await prisma.property.create({
    data: {
      name: 'Villa Serena',
      address: 'Via Roma 123, Milano',
      notes: 'Villa con giardino e piscina',
    },
  });

  // Crea proprietà 2
  const property2 = await prisma.property.create({
    data: {
      name: 'Residence Belvedere',
      address: 'Via Garibaldi 45, Roma',
      notes: 'Residence con vista panoramica',
    },
  });

  // Crea unità per proprietà 1
  const unit1Property1 = await prisma.unit.create({
    data: {
      propertyId: property1.id,
      name: 'Camera Deluxe',
      type: UnitType.ROOM,
      beds: 2,
      bath: 1,
      surface: 25,
      basePrice: 80,
      notes: 'Camera con vista giardino',
    },
  });

  const unit2Property1 = await prisma.unit.create({
    data: {
      propertyId: property1.id,
      name: 'Suite Premium',
      type: UnitType.ROOM,
      beds: 3,
      bath: 2,
      surface: 35,
      basePrice: 120,
      notes: 'Suite con balcone',
    },
  });

  const unit3Property1 = await prisma.unit.create({
    data: {
      propertyId: property1.id,
      name: 'Appartamento Giardino',
      type: UnitType.APARTMENT,
      beds: 4,
      bath: 2,
      surface: 70,
      basePrice: 150,
      notes: 'Appartamento con accesso diretto al giardino',
    },
  });

  // Crea unità per proprietà 2
  const unit1Property2 = await prisma.unit.create({
    data: {
      propertyId: property2.id,
      name: 'Camera Standard',
      type: UnitType.ROOM,
      beds: 2,
      bath: 1,
      surface: 20,
      basePrice: 65,
      notes: 'Camera standard con vista città',
    },
  });

  const unit2Property2 = await prisma.unit.create({
    data: {
      propertyId: property2.id,
      name: 'Camera Superior',
      type: UnitType.ROOM,
      beds: 2,
      bath: 1,
      surface: 25,
      basePrice: 85,
      notes: 'Camera superior con vista panoramica',
    },
  });

  const unit3Property2 = await prisma.unit.create({
    data: {
      propertyId: property2.id,
      name: 'Appartamento Panoramico',
      type: UnitType.APARTMENT,
      beds: 5,
      bath: 2,
      surface: 90,
      basePrice: 180,
      notes: 'Appartamento con terrazza panoramica',
    },
  });

  // Crea ospiti
  const guest1 = await prisma.guest.create({
    data: {
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario.rossi@example.com',
      phone: '+39 333 1234567',
      address: 'Via Verdi 10, Torino',
    },
  });

  const guest2 = await prisma.guest.create({
    data: {
      firstName: 'Giulia',
      lastName: 'Bianchi',
      email: 'giulia.bianchi@example.com',
      phone: '+39 345 7654321',
      address: 'Via Dante 25, Firenze',
    },
  });

  const guest3 = await prisma.guest.create({
    data: {
      firstName: 'Paolo',
      lastName: 'Verdi',
      email: 'paolo.verdi@example.com',
      phone: '+39 347 9876543',
      address: 'Via Manzoni 5, Bologna',
    },
  });

  // Crea prenotazioni
  // Prenotazione 1 - Property 1, Unit 1
  await prisma.booking.create({
    data: {
      unitId: unit1Property1.id,
      guestId: guest1.id,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-07'),
      price: 560, // 7 giorni * 80€
      source: 'Booking.com',
      notes: 'Richiesto late check-out',
    },
  });

  // Prenotazione 2 - Property 1, Unit 2
  await prisma.booking.create({
    data: {
      unitId: unit2Property1.id,
      guestId: guest2.id,
      startDate: new Date('2024-08-10'),
      endDate: new Date('2024-08-17'),
      price: 840, // 7 giorni * 120€
      source: 'AirBnB',
      notes: 'Richiesto servizio in camera',
    },
  });

  // Prenotazione 3 - Property 2, Unit 3
  await prisma.booking.create({
    data: {
      unitId: unit3Property2.id,
      guestId: guest3.id,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-09-10'),
      price: 1800, // 10 giorni * 180€
      source: 'Diretto',
      notes: 'Famiglia con bambini',
    },
  });

  // Prenotazione 4 - Property 2, Unit 1
  await prisma.booking.create({
    data: {
      unitId: unit1Property2.id,
      guestId: guest1.id,
      startDate: new Date('2024-09-15'),
      endDate: new Date('2024-09-20'),
      price: 325, // 5 giorni * 65€
      source: 'Expedia',
      notes: 'Viaggio di lavoro',
    },
  });

  // Prenotazione 5 - Property 1, Unit 3
  await prisma.booking.create({
    data: {
      unitId: unit3Property1.id,
      guestId: guest2.id,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-10-15'),
      price: 2250, // 15 giorni * 150€
      source: 'Diretto',
      notes: 'Soggiorno lungo',
    },
  });

  // Crea spese fisse
  // Spese fisse per Property 1
  await prisma.fixedExpense.create({
    data: {
      propertyId: property1.id,
      description: 'Affitto',
      amount: 1500,
      recurrence: RecurrenceType.MONTHLY,
      startDate: new Date('2024-01-01'),
    },
  });

  await prisma.fixedExpense.create({
    data: {
      propertyId: property1.id,
      description: 'Assicurazione',
      amount: 1200,
      recurrence: RecurrenceType.ANNUAL,
      startDate: new Date('2024-01-01'),
    },
  });

  // Spese fisse per Unit 3 Property 1
  await prisma.fixedExpense.create({
    data: {
      propertyId: property1.id,
      unitId: unit3Property1.id,
      description: 'Manutenzione giardino',
      amount: 100,
      recurrence: RecurrenceType.MONTHLY,
      startDate: new Date('2024-01-01'),
    },
  });

  // Spese fisse per Property 2
  await prisma.fixedExpense.create({
    data: {
      propertyId: property2.id,
      description: 'Condominio',
      amount: 800,
      recurrence: RecurrenceType.MONTHLY,
      startDate: new Date('2024-01-01'),
    },
  });

  await prisma.fixedExpense.create({
    data: {
      propertyId: property2.id,
      description: 'Tasse comunali',
      amount: 950,
      recurrence: RecurrenceType.ANNUAL,
      startDate: new Date('2024-01-01'),
    },
  });

  // Crea spese variabili
  // Spese variabili per Property 1
  await prisma.variableExpense.create({
    data: {
      propertyId: property1.id,
      date: new Date('2024-07-15'),
      description: 'Riparazione condizionatore',
      amount: 250,
      category: 'Manutenzione',
    },
  });

  await prisma.variableExpense.create({
    data: {
      propertyId: property1.id,
      unitId: unit2Property1.id,
      date: new Date('2024-07-20'),
      description: 'Sostituzione frigorifero',
      amount: 450,
      category: 'Elettrodomestici',
    },
  });

  // Spese variabili per Property 2
  await prisma.variableExpense.create({
    data: {
      propertyId: property2.id,
      date: new Date('2024-07-10'),
      description: 'Pulizia straordinaria',
      amount: 180,
      category: 'Pulizie',
    },
  });

  await prisma.variableExpense.create({
    data: {
      propertyId: property2.id,
      unitId: unit3Property2.id,
      date: new Date('2024-07-25'),
      description: 'Riparazione perdita acqua',
      amount: 320,
      category: 'Idraulica',
    },
  });

  // Crea contatti
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'Roberto',
      lastName: 'Neri',
      email: 'roberto.neri@example.com',
      phone: '+39 348 1122334',
      company: 'Agenzia Viaggi Sole',
      tags: ['agenzia', 'partner'],
      notes: 'Contatto principale per prenotazioni di gruppo',
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Laura',
      lastName: 'Gialli',
      email: 'laura.gialli@example.com',
      phone: '+39 349 5566778',
      tags: ['cliente', 'vip'],
      notes: 'Cliente abituale',
    },
  });

  // Crea richieste
  await prisma.inquiry.create({
    data: {
      contactId: contact1.id,
      subject: 'Disponibilità per gruppo turistico',
      message: 'Richiesta disponibilità per gruppo di 15 persone dal 15 al 20 settembre',
      status: InquiryStatus.NEW,
    },
  });

  await prisma.inquiry.create({
    data: {
      contactId: contact2.id,
      subject: 'Informazioni appartamento panoramico',
      message: 'Vorrei informazioni dettagliate sull\'appartamento panoramico e i servizi inclusi',
      status: InquiryStatus.IN_PROGRESS,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 