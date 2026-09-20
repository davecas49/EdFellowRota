-- ED Portal: fold faculty_contacts into profiles
-- Faculty are people too — a single identity table (profiles) replaces the
-- separate faculty_contacts list, per spec.md §5. Five faculty_contacts
-- entries (Anita Price, David Oakley, Dionne Barber, Joanne Rocks, Ute
-- Scrace) are already active administrator profiles; those rows are merged
-- in place, keeping role='administrator', rather than duplicated. The
-- "VACANT" seat has no email and is dropped rather than migrated, since
-- profiles.email is NOT NULL UNIQUE.

alter table profiles
  add column role_title text,
  add column department text,
  add column responsibilities text;

-- ── Merge overlaps: existing profiles, role kept, faculty fields added ─────

update profiles set
  role_title = 'UG Programme Administrator',
  department = 'UG Admin',
  responsibilities = 'Supporting Coordinators; UBMS Timetabling: CH, AC',
  phone = coalesce(phone, '01494 324074')
  where email = 'a.price13@nhs.net';

update profiles set
  role_title = 'UG Programme Coordinator',
  department = 'UG Admin',
  responsibilities = 'Overall Responsibility: UBMS; UBMS Timetabling: MSK RH',
  phone = coalesce(phone, '01296 982234')
  where email = 'david.oakley3@nhs.net';

update profiles set
  role_title = 'UG Programme Administrator',
  department = 'UG Admin',
  responsibilities = 'Supporting Coordinators; UBMS Timetabling: GI',
  phone = coalesce(phone, '01494 324182')
  where email = 'd.barber5@nhs.net';

update profiles set
  role_title = 'UG Programme Manager',
  department = 'UG Admin',
  responsibilities = 'Overall Responsibility: The UG Programme',
  phone = coalesce(phone, '07929 831307')
  where email = 'joanne.rocks@nhs.net';

update profiles set
  role_title = 'UG Programme Coordinator',
  department = 'UG Admin',
  responsibilities = 'Overall Responsibility: Oxford'
  where email = 'ute.scrace@nhs.net';

-- ── New faculty profiles: unactivated (user_id null) until first sign-in ──

insert into profiles
  (name, email, role, initials, phone, role_title, department, responsibilities, is_active)
values
  ('Adam May', 'adam.may5@nhs.net', 'faculty', 'AM', '07533 994905', 'Simulation & Skills Coordinator', 'Sim Faculty', null, true),
  ('Benjamin Repton', 'benjamin.repton@nhs.net', 'faculty', 'BR', '07929 039047', 'Simulation & Skills Educator', 'Sim Faculty', null, true),
  ('Dave Holland', 'david.holland6@nhs.net', 'faculty', 'DH', null, 'Simulation & Skills Educator', 'Sim Faculty', null, true),
  ('Fatimah Nadeem', 'fatimah.nadeem@nhs.net', 'faculty', 'FN', null, 'Simulation & Skills Administrator', 'Sim Faculty', null, true),
  ('Gemma Blaza', 'g.blaza@nhs.net', 'faculty', 'GB', '07455 235112', 'Simulation Faculty Lead', 'Sim Faculty', null, true),
  ('Harriet Lewis', 'harriet.lewis16@nhs.net', 'faculty', 'HL', null, 'Simulation & Skills Facilitator', 'Sim Faculty', null, true),
  ('Heather Davis', 'heather.davis3@nhs.net', 'faculty', 'HD', null, 'Simulation & Skills Facilitator', 'Sim Faculty', null, true),
  ('Joe Williams', 'joe.williams4@nhs.net', 'faculty', 'JW', '01296 831293', 'XR Simulation Facilitator', 'Sim Faculty', null, true),
  ('Kate Olson', 'kate.olson@nhs.net', 'faculty', 'KO', '07375 868518', 'Simulation & Skills Educator', 'Sim Faculty', null, true),
  ('Lucie Merrick', 'lucie.merrick@nhs.net', 'faculty', 'LM', null, 'Simulation & Skills Facilitator', 'Sim Faculty', null, true),
  ('Matthew Gomme', 'matthew.gomme@nhs.net', 'faculty', 'MG', null, 'Simulation Technician', 'Sim Faculty', null, true),
  ('Ren Hodges', 'karen.hodges3@nhs.net', 'faculty', 'RH', '07436 773791', 'Senior Simulation Technician', 'Sim Faculty', null, true),
  ('Sim & Skills Team', 'bht.simulation@nhs.net', 'faculty', 'SST', '01296 255688', 'General Enquiries', 'Sim Faculty', null, true),
  ('UG Admin Team', 'bht.med.ug.admin@nhs.net', 'faculty', 'UAT', '01296 316892 option 4', 'General Enquiries', 'UG Admin', null, true);

drop table faculty_contacts;
