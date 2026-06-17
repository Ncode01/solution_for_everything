-- ============================================================
-- RCCS Command Center — Supabase Seed Data
-- Run: supabase db reset (local) or apply via dashboard
-- ⚠️  No real personal contact details. Emails/phones are blank.
-- ============================================================

-- ─── profiles ────────────────────────────────────────────────────────────────
insert into public.profiles (id, display_name, role, committee, grade_or_class, skills, availability_status, workload_level) values
  ('00000000-0000-0000-0000-000000000001', 'Nadula Nisith',              'Secretary',           'Executive',  'Grade 12', array['Coordination','Documentation','Planning'],       'Available', 'Heavy'),
  ('00000000-0000-0000-0000-000000000002', 'Shasvinth Srikanth',         'Chairman',            'Executive',  'Grade 12', array['Leadership','Public Speaking','Strategy'],       'Busy',      'Overloaded'),
  ('00000000-0000-0000-0000-000000000003', 'Agsharan Kathirkhamaruban',  'Treasurer',           'Finance',    'Grade 12', array['Budgeting','Finance','Spreadsheets'],            'Available', 'Normal'),
  ('00000000-0000-0000-0000-000000000004', 'Afthab Ahamed',              'Assistant Chairman',  'Executive',  'Grade 12', array['Coordination','Operations'],                    'Available', 'Normal'),
  ('00000000-0000-0000-0000-000000000005', 'Abdul Munaf',                'Editor',              'PR & Media', 'Grade 11', array['Copywriting','Editing','Captions'],             'Available', 'Heavy'),
  ('00000000-0000-0000-0000-000000000006', 'Zakir Hassan',               'Assistant Treasurer', 'Finance',    'Grade 11', array['Finance','Data Entry'],                         'Available', 'Normal'),
  ('00000000-0000-0000-0000-000000000007', 'Asel Fernando',              'PR Lead',             'PR & Media', 'Grade 11', array['Design','Canva','Reels'],                       'Available', 'Heavy'),
  ('00000000-0000-0000-0000-000000000008', 'Tharindu Perera',            'Development Lead',    'Development','Grade 12', array['Web Dev','React','Python'],                     'Busy',      'Heavy'),
  ('00000000-0000-0000-0000-000000000009', 'Kavya Ratnayake',            'Events Coordinator',  'Events',     'Grade 11', array['Logistics','Events','Scheduling'],              'Available', 'Normal'),
  ('00000000-0000-0000-0000-000000000010', 'Sahan Jayawardena',          'Sponsorship Lead',    'Sponsorship','Grade 12', array['Negotiation','Outreach','Presentations'],       'Busy',      'Heavy')
on conflict (id) do nothing;

-- ─── projects ────────────────────────────────────────────────────────────────
insert into public.projects (id, name, year, type, status, priority, description, owner_id, start_date, end_date, final_event_date, progress) values
  ('10000000-0000-0000-0000-000000000001', 'Beyond The User Interface 2026', 2026, 'ICT Day / Competition / Event',            'Active',   'Urgent', 'RCCS flagship annual ICT event at BMICH Lotus Room with online competitions and ICT Day.',              '00000000-0000-0000-0000-000000000002', '2026-06-01', '2026-11-30', '2026-10-25', 42),
  ('10000000-0000-0000-0000-000000000002', 'SparkIT''26',                    2026, 'Outreach / Workshop / Network Building',   'Active',   'High',   'RCCS outreach initiative: Flash sessions, Fusion school visits, and Family mentorship network.',        '00000000-0000-0000-0000-000000000001', '2026-05-01', '2026-12-31', '2026-09-20', 35),
  ('10000000-0000-0000-0000-000000000003', 'Tesseract''26',                  2026, 'Educational Workshop / Seminar Series',    'Planning', 'Medium', 'Educational workshops and expert seminars for RCCS members and interested students.',                  '00000000-0000-0000-0000-000000000001', '2026-07-01', '2026-11-30', null,         15),
  ('10000000-0000-0000-0000-000000000004', 'Digitalizer''26',                2026, 'Internal System',                          'Planning', 'Medium', 'Internal digital transformation: Member Management System, Digital Notice Board, Venue Booking.',     '00000000-0000-0000-0000-000000000002', '2026-06-01', '2026-12-31', null,         10),
  ('10000000-0000-0000-0000-000000000005', 'The Syntax Technological Publication', 2026, 'Publication',                        'Idea',     'Low',    'Annual technology magazine covering AI, cybersecurity, dev, and student tech stories.',               '00000000-0000-0000-0000-000000000001', '2026-08-01', '2026-10-25', null,          5),
  ('10000000-0000-0000-0000-000000000006', 'PROTOX''26',                     2026, 'Hackathon',                                'Planning', 'High',   'Annual RCCS Hackathon with teams competing to build solutions to real-world problems.',               '00000000-0000-0000-0000-000000000004', '2026-08-01', '2026-12-15', '2026-11-20', 8)
on conflict (id) do nothing;

-- ─── phases ──────────────────────────────────────────────────────────────────
insert into public.phases (id, project_id, name, description, owner_id, start_date, end_date, status, progress, sort_order) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Phase 1: Online Competitions', 'Launch and manage all online competition categories.',            '00000000-0000-0000-0000-000000000002', '2026-06-01', '2026-09-30', 'In Progress', 55, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Phase 2: ICT Day',             'Full-day event at BMICH Lotus Room.',                            '00000000-0000-0000-0000-000000000002', '2026-10-01', '2026-10-25', 'Not Started', 10, 2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Phase 1: SparkIT Flash',       'Regular sessions hosted at Royal College.',                      '00000000-0000-0000-0000-000000000001', '2026-05-01', '2026-08-31', 'In Progress', 60, 1),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Phase 2: SparkIT Fusion',      'RCCS visits selected partner schools.',                          '00000000-0000-0000-0000-000000000001', '2026-07-01', '2026-09-20', 'In Progress', 25, 2),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Phase 3: SparkIT Family',      'Long-term mentorship network.',                                  '00000000-0000-0000-0000-000000000001', '2026-09-01', '2026-12-31', 'Not Started',  0, 3),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'Phase 1: Member Management System', 'Build a digital member registry.',                          '00000000-0000-0000-0000-000000000008', '2026-06-01', '2026-08-31', 'In Progress', 20, 1),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'Phase 2: Digital Notice Board','Replace physical notice boards.',                               '00000000-0000-0000-0000-000000000008', '2026-08-01', '2026-10-31', 'Not Started',  0, 2),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 'Phase 3: Venue Booking System','Online system for booking school venues.',                      '00000000-0000-0000-0000-000000000008', '2026-10-01', '2026-12-31', 'Not Started',  0, 3)
on conflict (id) do nothing;

-- ─── milestones ──────────────────────────────────────────────────────────────
insert into public.milestones (id, project_id, phase_id, name, due_date, owner_id, status, description) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Competition registration opens',     '2026-07-01', '00000000-0000-0000-0000-000000000002', 'Completed',   'Registration portal live.'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Registration deadline',              '2026-08-15', '00000000-0000-0000-0000-000000000002', 'In Progress', 'All competition registrations must be submitted.'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Submission deadline',                '2026-09-10', '00000000-0000-0000-0000-000000000001', 'Not Started', 'All competition entries submitted.'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'ICT Day agenda finalized',           '2026-10-10', '00000000-0000-0000-0000-000000000002', 'Not Started', 'Full event agenda confirmed.'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Awards and certificates prepared',   '2026-10-20', '00000000-0000-0000-0000-000000000001', 'Not Started', 'Trophies, certs, gifts ready.'),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Flash session calendar finalized',   '2026-05-20', '00000000-0000-0000-0000-000000000001', 'Completed',   'Full Flash schedule shared with team.'),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Fusion schools shortlisted',         '2026-07-10', '00000000-0000-0000-0000-000000000002', 'In Progress', '3-5 partner schools selected.')
on conflict (id) do nothing;

-- ─── tasks ───────────────────────────────────────────────────────────────────
insert into public.tasks (id, project_id, phase_id, title, description, assignee_id, due_date, priority, status) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Finalize competition registration form',   'Build and test registration for all 5 competition categories.',         '00000000-0000-0000-0000-000000000002', '2026-06-25', 'Urgent', 'Done'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Design registration launch poster',        'Create BTUI 2026 registration launch poster.',                          '00000000-0000-0000-0000-000000000007', '2026-06-28', 'High',   'Review'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Write registration launch caption',        'Draft caption for Instagram/Facebook registration post.',                '00000000-0000-0000-0000-000000000005', '2026-06-28', 'High',   'Doing'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Prepare ICT Quiz rules document',          'Write official rules, format, and marking scheme.',                     '00000000-0000-0000-0000-000000000002', '2026-07-10', 'Medium', 'To Do'),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Confirm award certificate format',         'Finalize certificate template with school approval.',                   '00000000-0000-0000-0000-000000000001', '2026-09-01', 'Medium', 'To Do'),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Finalize next Flash session topic',        'Decide topic and format for next Flash session.',                       '00000000-0000-0000-0000-000000000001', '2026-06-25', 'High',   'Doing'),
  ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Contact speaker for Flash Session 3',     'Reach out and confirm speaker.',                                        '00000000-0000-0000-0000-000000000001', '2026-06-30', 'High',   'To Do'),
  ('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Prepare school selection criteria sheet', 'Create scoring sheet to evaluate schools.',                             '00000000-0000-0000-0000-000000000002', '2026-07-05', 'Medium', 'To Do'),
  ('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', 'Collect MMS requirements',                 'Interview exec committee and teachers for MMS requirements.',           '00000000-0000-0000-0000-000000000008', '2026-06-30', 'High',   'Doing'),
  ('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', null,                                   'Define PROTOX challenge categories',        'Finalize what problem categories teams will tackle.',                   '00000000-0000-0000-0000-000000000004', '2026-08-15', 'High',   'To Do')
on conflict (id) do nothing;

-- ─── meetings ────────────────────────────────────────────────────────────────
insert into public.meetings (id, project_id, title, type, date, time, location, agenda, notes, next_meeting_date) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'BTUI Planning Meeting #1',  'Project Meeting',   '2026-06-10', '16:00', 'RCCS Room',      'Review competition categories and registration plan', 'Agreed on 5 competition categories. Registration opens July 1.', '2026-06-24'),
  ('50000000-0000-0000-0000-000000000002', null,                                   'RCCS Executive Meeting',    'Executive Meeting', '2026-06-15', '15:00', 'Principal Room', 'Review all active projects. Approve BTUI budget.',   'All projects reviewed. Budget approved pending treasurer sign-off.', '2026-07-01'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'SparkIT Fusion Planning',   'Project Meeting',   '2026-06-20', '14:00', 'RCCS Room',      'Shortlist schools for Fusion visits.',                'Identified 4 target schools. Letters to go out by July 5.', null)
on conflict (id) do nothing;

-- ─── meeting_attendees ───────────────────────────────────────────────────────
insert into public.meeting_attendees (meeting_id, member_id) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000009')
on conflict do nothing;

-- ─── meeting_action_items ────────────────────────────────────────────────────
insert into public.meeting_action_items (meeting_id, title, owner_id, due_date, status) values
  ('50000000-0000-0000-0000-000000000001', 'Send registration form link to team',       '00000000-0000-0000-0000-000000000002', '2026-06-15', 'Done'),
  ('50000000-0000-0000-0000-000000000001', 'Design BTUI banner for social media',       '00000000-0000-0000-0000-000000000007', '2026-06-25', 'In Progress'),
  ('50000000-0000-0000-0000-000000000002', 'Prepare BTUI budget proposal',              '00000000-0000-0000-0000-000000000003', '2026-06-20', 'Done'),
  ('50000000-0000-0000-0000-000000000003', 'Draft school invitation letters',            '00000000-0000-0000-0000-000000000001', '2026-07-05', 'Open')
on conflict do nothing;

-- ─── sponsors ────────────────────────────────────────────────────────────────
insert into public.sponsors (id, project_id, name, contact_person, package_name, amount, stage, assigned_member_id, last_contacted_date, next_follow_up_date, payment_status, notes) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'TechCorp Lanka',    'Mr. Pradeep',   'Gold Sponsor',   150000, 'Negotiating',   '00000000-0000-0000-0000-000000000010', '2026-06-10', '2026-06-20', 'Not Requested', 'Interested in logo placement on event banners.'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'DataSys Pvt Ltd',  'Ms. Nishara',   'Silver Sponsor', 75000,  'Proposal Sent', '00000000-0000-0000-0000-000000000010', '2026-06-05', '2026-06-22', 'Not Requested', 'Proposal sent. Awaiting reply.'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Royal Bookshop',   'Mr. Bandara',   'Bronze Sponsor', 30000,  'Contacted',     '00000000-0000-0000-0000-000000000010', '2026-06-01', '2026-06-25', 'Not Requested', 'Initial call done.'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'EduTech LK',       'Dr. Kumarasiri','Community Partner', 0,  'Interested',    '00000000-0000-0000-0000-000000000010', '2026-06-12', '2026-06-28', 'Not Requested', 'Interested in non-monetary partnership.')
on conflict (id) do nothing;

-- ─── budgets ─────────────────────────────────────────────────────────────────
insert into public.budgets (id, project_id, expected_income, expected_expense, confirmed_income, confirmed_expense, notes) values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 350000, 280000, 0,     0,     'Expecting TechCorp + DataSys + others = ~350k. Venue alone is ~120k.'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',  50000,  40000, 0,     0,     'Minimal budget. School visit transport is biggest cost.'),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 200000, 160000, 0,     0,     'PROTOX sponsorship target: 200k. Prize money and venue.')
on conflict (id) do nothing;

-- ─── transactions ────────────────────────────────────────────────────────────
insert into public.transactions (project_id, type, category, amount, date, paid_by_id, notes) values
  ('10000000-0000-0000-0000-000000000001', 'Expense', 'Printing',   5000,  '2026-06-12', '00000000-0000-0000-0000-000000000003', 'Competition rule sheets and registration forms.'),
  ('10000000-0000-0000-0000-000000000001', 'Expense', 'Web/IT',     2500,  '2026-06-15', '00000000-0000-0000-0000-000000000008', 'Domain renewal for BTUI registration page.'),
  ('10000000-0000-0000-0000-000000000002', 'Expense', 'Transport',  3500,  '2026-06-18', '00000000-0000-0000-0000-000000000001', 'Transport for first school scouting visit.')
on conflict do nothing;

-- ─── approval_requests ───────────────────────────────────────────────────────
insert into public.approval_requests (project_id, title, description, requested_by_id, approver_id, status, submitted_date, related_type) values
  ('10000000-0000-0000-0000-000000000001', 'BTUI Budget Approval',         'Approve the initial BTUI 2026 budget of Rs 280,000.',        '00000000-0000-0000-0000-000000000003', null, 'Submitted', '2026-06-17', 'Budget'),
  ('10000000-0000-0000-0000-000000000001', 'BMICH Venue Booking Request',  'Request approval to proceed with BMICH Lotus Room booking.', '00000000-0000-0000-0000-000000000002', null, 'Draft',     '2026-06-17', 'General')
on conflict do nothing;

-- ─── file_links ──────────────────────────────────────────────────────────────
insert into public.file_links (project_id, title, category, url, owner_id, status) values
  ('10000000-0000-0000-0000-000000000001', 'BTUI 2026 Competition Registration Form', 'Project Proposal', 'https://docs.google.com/forms/btui2026', '00000000-0000-0000-0000-000000000002', 'Final'),
  ('10000000-0000-0000-0000-000000000001', 'BTUI Budget Spreadsheet',                 'Budget',           'https://docs.google.com/spreadsheets/btui-budget', '00000000-0000-0000-0000-000000000003', 'Draft'),
  ('10000000-0000-0000-0000-000000000002', 'SparkIT Flash Session Schedule',          'Event Agenda',     'https://docs.google.com/sparkit-schedule', '00000000-0000-0000-0000-000000000001', 'Final')
on conflict do nothing;
