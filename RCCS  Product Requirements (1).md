# Product Requirements Document

# RCCS Project Management System

## 1\. Product Name

**RCCS Command Center**

Alternative names:

* RCCS Ops

* RCCS Project Hub

* RCCS Grid

* RCCS Mission Control

Recommended final name:

**RCCS Command Center**

Reason: RCCS projects are not simple task lists. They are full-scale operations involving events, committees, PR, sponsorships, logistics, school coordination, competitions, software development, and approvals. The system should feel like a central control room.

---

## 2\. Product Summary

The **RCCS Command Center** is a custom project management and operations platform designed specifically for the Royal College Computer Society.

Its purpose is to help RCCS plan, manage, track, and complete all society projects from the first idea to final report without losing information midway.

The system will centralize:

* Annual project planning

* Project proposals

* Project timelines

* Committee assignments

* Tasks and deliverables

* PR and media schedules

* Sponsorship tracking

* Budgets and expenses

* Meetings and decisions

* Event-day operations

* Files and approvals

* Progress reports

* Post-project documentation

The system must be extremely user-friendly because it will be used by school students, committee members, project heads, designers, developers, finance teams, logistics teams, teachers-in-charge, and future RCCS batches.

---

## 3\. Problem Statement

RCCS handles many large projects during the year, such as:

* Beyond The User Interface 2026

* SparkIT’26

* Tesseract’26

* Royal College Sports App

* Digitalizer’26

* The Syntax Technological Publication

* PROTOX’26

Each project has its own phases, teams, budgets, PR plans, deadlines, sponsors, meetings, approvals, and event-day responsibilities.

Currently, project information can get scattered across:

* WhatsApp groups

* Google Docs

* Google Sheets

* Canva links

* Drive folders

* Verbal meeting decisions

* Personal notes

* Individual committee members

This creates problems such as:

* Members forgetting deadlines

* PR posts clashing or being delayed

* Unclear task ownership

* Losing meeting decisions

* Difficulty tracking sponsor progress

* Budget confusion

* Poor handover between committees

* Projects becoming dependent on a few people’s memory

* Future batches not understanding what happened before

The system must solve this by becoming the single source of truth for RCCS operations.

---

## 4\. Product Vision

To create a centralized, student-friendly, event-aware project management system that helps RCCS execute every project clearly, collaboratively, and iteratively from planning to completion.

The system should help RCCS answer these questions at any moment:

* What projects are active?

* What is the current phase of each project?

* What deadlines are coming soon?

* What PR content needs to be posted?

* Who is responsible for each task?

* What is pending approval?

* Which sponsors are confirmed?

* What is the current budget status?

* What decisions were made in the last meeting?

* What risks could delay the project?

* What needs to happen next?

---

## 5\. Core Product Philosophy

The system should not be a generic Jira clone.

RCCS does not operate like a normal software company. RCCS operates like a hybrid of:

* Event management team

* Media agency

* Educational organization

* Student society

* Sponsorship team

* Software development team

* Volunteer network

Therefore, the product should follow this philosophy:

## Deadline-first, not task-first.

Tasks matter, but RCCS projects are driven by dates.

Examples:

* Registration opening date

* Poster publishing date

* Competition submission deadline

* Sponsor confirmation deadline

* Event day

* Agenda finalization date

* Printing deadline

* Guest invitation deadline

The calendar should be one of the strongest parts of the system.

---

## 6\. Recommended Project Management Approach

The system should use a custom method called:

# Event-Based Iterative Management

This combines:

* Milestone planning

* Kanban-style task tracking

* Calendar-based execution

* Weekly review cycles

* Approval workflows

* Post-event retrospectives

The structure should be:

Year  
→ Project  
→ Phase  
→ Milestone  
→ Deliverable  
→ Task  
→ Subtask

Example:

BTUI’26  
→ Online Competitions  
→ Registration Launch  
→ Registration Poster Campaign  
→ Design poster  
→ Review poster  
→ Approve caption  
→ Publish post

This structure matches RCCS better than traditional Scrum.

---

## 7\. Target Users

## 7.1 Executive Committee

Includes Chairman, Secretary, Treasurer, Assistant Chairman, Assistant Secretary, Chief Coordinator, Editor, and other office bearers.

Needs:

* Full overview of all projects

* Deadlines

* Approvals

* Budget visibility

* Committee workload

* Risk alerts

* Reports

## 7.2 Project Heads

Examples:

* BTUI Project Chairman

* SparkIT Co-Chairmen

* Tesseract lead

* Digitalizer lead

* PROTOX lead

Needs:

* Project workspace

* Team assignments

* Timeline tracking

* Task distribution

* Meeting records

* Progress reporting

## 7.3 PR and Media Team

Needs:

* Full PR calendar

* Poster/reel/video schedule

* Caption approval

* Design status

* Platform tracking

* Sponsor post tracking

* Publishing history

## 7.4 Sponsorship Team

Needs:

* Sponsor pipeline

* Contact details

* Sponsor package tracking

* Proposal status

* Payment status

* Sponsor deliverables

## 7.5 Finance Team

Needs:

* Budget plan

* Income tracking

* Expense tracking

* Receipts

* Surplus/deficit view

* Project-wise financial summary

## 7.6 Logistics Team

Needs:

* Venue booking

* Equipment lists

* Event-day checklist

* Supplier tracking

* Transport planning

* Inventory

## 7.7 Developers

For Sports App, Digitalizer, websites, registration systems, and internal platforms.

Needs:

* Feature roadmap

* Technical tasks

* Bugs

* Deployment checklist

* GitHub/project links

* Testing status

## 7.8 Teachers-in-Charge

Needs:

* High-level visibility

* Approval requests

* Project documents

* Budget summaries

* Event plans

* Final reports

## 7.9 General Members

Needs:

* Assigned tasks

* Deadlines

* Meeting notes

* Announcements

* Attendance

* Contribution history

---

## 8\. Scope

## 8.1 In Scope

The system must include:

* Annual project dashboard

* Project workspace

* Milestone and phase tracking

* Task management

* PR calendar

* Sponsorship tracking

* Budget tracking

* Meeting management

* Member management

* File/document management

* Approval workflows

* Event-day mode

* Reports and handover archive

## 8.2 Out of Scope for MVP

The first version does not need:

* AI automation

* Mobile app

* Complex chat system

* Full accounting software

* Public participant registration

* Advanced analytics

* External school portal

* Payment gateway

* Inventory barcode system

These can be added later.

---

## 9\. RCCS Project Information Model

Every project in the system must contain the following information.

## 9.1 Basic Project Details

Each project should have:

* Project name

* Project year

* Project type

* Project status

* Project priority

* Project description

* Project objectives

* Main project owner

* Project secretary

* Treasurer or finance lead

* Teachers-in-charge

* Start date

* End date

* Final event date, if applicable

* Venue, if applicable

* Partner organizations

* Project links

* Related documents

Project status options:

* Idea

* Proposal Drafting

* Awaiting Approval

* Approved

* Planning

* Active

* On Hold

* Event Week

* Completed

* Archived

Project types:

* ICT Day

* Workshop

* Seminar

* Competition

* Software Product

* Publication

* Outreach Project

* Internal System

* Sports Coverage

* Hackathon

* Mixed Project

---

## 9.2 Project Phases

Each project should be broken into phases.

Example for BTUI:

* Phase 1: Online Competitions

* Phase 2: ICT Day

Example for SparkIT:

* Phase 1: SparkIT Flash

* Phase 2: SparkIT Fusion

* Phase 3: SparkIT Family

Example for Digitalizer:

* Phase 1: Member Management System

* Phase 2: Digital Notice Board

* Phase 3: Sponsorship Platform

* Phase 4: Venue Booking System

* Phase 5: Website and IT Solutions

Each phase should have:

* Phase name

* Description

* Start date

* End date

* Owner

* Deliverables

* Status

* Dependencies

* Risks

* Progress percentage

---

## 9.3 Milestones

Milestones are the backbone of the system.

Each milestone should have:

* Milestone name

* Project

* Phase

* Due date

* Owner

* Status

* Description

* Linked deliverables

* Linked tasks

* Dependencies

* Approval status

Milestone status options:

* Not Started

* In Progress

* Blocked

* Pending Approval

* Completed

* Delayed

* Cancelled

Example BTUI milestones:

* Competition registration opens

* Competition registration closes

* Submissions open

* Submissions close

* Quiz finalists selected

* ICT Day agenda finalized

* Awards finalized

* BMICH event completed

* Final report submitted

Example SparkIT milestones:

* Flash session plan finalized

* Speaker confirmation

* Fusion school selection

* Resource package finalized

* Workshop agenda confirmed

* Event-day logistics confirmed

* SparkIT Family onboarding

* Monthly mentorship cycle begins

---

## 9.4 Deliverables

A deliverable is a clear output.

Examples:

* Registration website

* Poster

* Reel

* Sponsor proposal

* Invitation letter

* Final agenda

* Budget sheet

* Certificates

* Quiz question set

* Workshop slides

* Event report

* Sponsor appreciation post

* Final project archive

Each deliverable should have:

* Deliverable name

* Project

* Phase

* Type

* Owner

* Due date

* Status

* File/link

* Approval required

* Approver

* Version history

Deliverable status options:

* Not Started

* Drafting

* In Review

* Changes Requested

* Approved

* Published

* Completed

* Archived

---

## 9.5 Tasks

Tasks are the smallest operational units.

Each task should have:

* Task title

* Description

* Project

* Phase

* Milestone

* Deliverable

* Assignee

* Reviewer

* Due date

* Priority

* Status

* Comments

* Attachments

* Dependencies

* Created by

* Created date

Task status options:

* To Do

* Doing

* Waiting

* Review

* Approved

* Done

* Blocked

Priority options:

* Urgent

* High

* Medium

* Low

---

## 10\. Main Product Modules

# 10.1 Dashboard

The dashboard is the first screen users see.

It should show:

* Active projects

* Upcoming deadlines

* Overdue tasks

* Pending approvals

* PR posts scheduled this week

* Sponsor updates

* Budget alerts

* Meeting action items

* Event countdowns

* Risk warnings

Example cards:

* BTUI’26: 72% complete, next deadline: Competition Poster Launch

* SparkIT’26: 48% complete, next deadline: School Selection

* Tesseract’26: 35% complete, next deadline: Session Schedule Finalization

Dashboard filters:

* My tasks

* My projects

* This week

* Overdue

* Pending approval

* PR only

* Finance only

* Event day mode

---

# 10.2 Project Workspace

Every project gets a dedicated workspace.

Each workspace should include:

* Overview

* Timeline

* Phases

* Milestones

* Tasks

* PR Plan

* Budget

* Sponsors

* Committee

* Meetings

* Files

* Risks

* Reports

The project workspace should feel like a complete project folder, not just a task board.

---

# 10.3 Calendar System

The calendar is a core feature.

It should include:

* Project deadlines

* PR posts

* Meetings

* Competition deadlines

* Event dates

* Sponsor deadlines

* Payment deadlines

* Printing deadlines

* Venue booking dates

* School exam blackout periods

* Approval deadlines

Calendar views:

* Month view

* Week view

* Day view

* Agenda view

* Project timeline view

* PR-only calendar

* Event-day schedule

Calendar item types:

* Task deadline

* Milestone deadline

* PR post

* Meeting

* Event

* Approval

* Sponsor follow-up

* Payment

* Logistics

* Competition

Each calendar item should have:

* Title

* Date

* Time

* Type

* Project

* Owner

* Status

* Linked task/deliverable

* Reminder setting

---

# 10.4 PR Planner

The PR Planner is one of the most important RCCS-specific modules.

It should manage:

* Posters

* Reels

* Videos

* Teasers

* Captions

* Sponsor posts

* Registration announcements

* Competition reminders

* Speaker reveals

* Event countdowns

* Result announcements

* Thank-you posts

Each PR item should have:

* Content title

* Project

* Campaign

* Platform

* Publish date

* Publish time

* Designer

* Caption writer

* Reviewer

* Approval status

* Canva/Figma link

* Caption

* Hashtags

* Media file

* Publishing status

* Notes

PR item status:

* Idea

* Copywriting

* Designing

* Editing

* Internal Review

* Teacher Review

* Approved

* Scheduled

* Posted

* Archived

Platform options:

* Instagram

* Facebook

* LinkedIn

* WhatsApp

* Website

* YouTube

* Email

PR calendar should support drag-and-drop rescheduling.

---

# 10.5 Campaign View

Projects like BTUI and SparkIT need PR campaigns, not just individual posts.

Example BTUI campaign:

* Theme teaser

* Competition reveal

* Registration opening

* Competition category reveal

* Sponsor reveal

* Countdown

* ICT Day highlights

* Results

* Thank-you post

Each campaign should have:

* Campaign name

* Project

* Goal

* Start date

* End date

* Content list

* Target audience

* Platforms

* Status

* Performance notes

---

# 10.6 Sponsorship CRM

The sponsorship module should work like a mini CRM.

Sponsor stages:

* Lead

* Contacted

* Interested

* Proposal Sent

* Meeting Scheduled

* Negotiating

* Confirmed

* Invoice/Payment Pending

* Paid

* Deliverables Pending

* Completed

* Rejected

Each sponsor record should include:

* Sponsor name

* Contact person

* Contact number

* Email

* Package

* Amount

* Project

* Assigned member

* Current stage

* Last contacted date

* Next follow-up date

* Proposal link

* Agreement link

* Payment proof

* Sponsor deliverables

Sponsor deliverables may include:

* Logo on poster

* Logo on website

* Social media post

* Banner placement

* Event mention

* Stall space

* Video mention

* Certificate branding

---

# 10.7 Budget and Finance Module

Each project should have a budget section.

Budget fields:

* Total expected income

* Total expected expenditure

* Current confirmed income

* Current confirmed expenditure

* Pending payments

* Surplus/deficit

* Sponsor income

* Donation income

* Expense categories

* Receipts

* Approval status

Expense categories:

* Venue

* Audio/visual

* Lighting

* Decorations

* Certificates

* Medals

* Trophies

* Refreshments

* Transport

* Printing

* PR

* Web/IT

* Equipment

* Miscellaneous

Each transaction should include:

* Date

* Project

* Category

* Amount

* Paid by

* Approved by

* Receipt

* Notes

Finance alerts:

* Budget exceeded

* Sponsor payment overdue

* Receipt missing

* Approval pending

* Expense added without category

---

# 10.8 Meeting Management

The system should turn meetings into action.

Each meeting record should include:

* Meeting title

* Project

* Date

* Time

* Location or online link

* Attendees

* Absentees

* Agenda

* Discussion notes

* Decisions

* Action items

* Next meeting date

Action items should automatically become tasks.

Example:

Decision: Registration opens on October 1\.

Action item: Prepare registration launch poster.

Assigned to: Media team.

Deadline: September 27\.

Status: To Do.

Meeting types:

* Executive meeting

* Project meeting

* PR meeting

* Sponsorship meeting

* Event logistics meeting

* Teacher approval meeting

* Post-project review

---

# 10.9 Member Management

Each RCCS member should have a profile.

Member profile fields:

* Name

* Grade/Class

* Role

* Email

* Phone number

* Committee

* Skills

* Projects assigned

* Tasks assigned

* Attendance

* Contribution history

* Achievements

* Availability

* Workload level

Skill tags:

* Web development

* App development

* UI/UX

* Graphic design

* Video editing

* Photography

* PR writing

* Sponsorship

* Finance

* Logistics

* Event hosting

* Robotics

* Cybersecurity

* Competitive programming

* Documentation

Workload levels:

* Light

* Normal

* Heavy

* Overloaded

The system should prevent assigning too many tasks to one person.

---

# 10.10 Approval System

RCCS has many items that need approval.

Examples:

* Posters

* Captions

* Sponsor proposals

* Budgets

* Invitations

* Agendas

* Event plans

* Public announcements

* Website pages

* Final reports

Approval status:

* Draft

* Submitted

* Changes Requested

* Approved

* Rejected

* Published

Approval record should include:

* Submitted by

* Submitted date

* Approver

* Decision

* Comments

* Final approved file

Approver roles:

* Project Head

* Secretary

* Chairman

* Editor

* Treasurer

* Teacher-in-Charge

---

# 10.11 File and Document Management

Each project should have organized file sections.

Suggested file folders:

* Project Proposal

* Budget

* PR

* Sponsorship

* Meeting Notes

* Invitations

* Certificates

* Designs

* Videos

* Event Agenda

* Final Report

* Receipts

* Legal/Approval Documents

Each file should have:

* File name

* Type

* Project

* Uploaded by

* Upload date

* Version

* Status

* Link

* Notes

The system does not need to store every file internally at first. It can link to Google Drive, Canva, Figma, GitHub, and Google Docs.

---

# 10.12 Risk and Issue Tracker

Each project should track risks.

Risk fields:

* Risk title

* Project

* Description

* Probability

* Impact

* Owner

* Mitigation plan

* Status

* Deadline

Risk probability:

* Low

* Medium

* High

Risk impact:

* Low

* Medium

* High

* Critical

Example risks:

* Sponsor payment delayed

* Venue not confirmed

* Poster approval delayed

* Speaker unavailable

* Low registrations

* Website not ready

* Printing delay

* Budget overrun

* School approval delayed

* Weather issue

* Exam period conflict

---

# 10.13 Event-Day Mode

For physical events such as BTUI, SparkIT Fusion, PROTOX, seminars, and workshops, the system should have a special mode.

Event-Day Mode should show:

* Live agenda

* Current session

* Next session

* Team responsibilities

* Guest arrival status

* Registration count

* AV status

* Certificate status

* Refreshment status

* Emergency contacts

* Pending issues

* Announcements

Example checklist:

* Registration desk ready

* Oil lamp ready

* Chief guest arrived

* Intro video ready

* Quiz system tested

* Certificates arranged

* Photographer assigned

* Refreshments delivered

* National anthem ready

Event-day task status:

* Not Ready

* Ready

* In Progress

* Completed

* Problem

---

# 10.14 Reports and Archive

At the end of each project, the system should generate a project archive.

Archive should include:

* Final project summary

* Completed milestones

* Final budget

* Sponsor list

* PR posts

* Attendance

* Event photos/videos

* Meeting records

* Problems faced

* Lessons learned

* Recommendations for next year

* Final report document

This is critical for future RCCS batches.

---

## 11\. Existing RCCS Projects to Add Initially

The system should launch with the following project records.

## 11.1 Beyond The User Interface 2026

Project type: ICT Day / Competition / Event

Main structure:

* Phase 1: Online Competitions

* Phase 2: ICT Day

Competition categories:

* Programming

* Web Development

* Graphic Designing

* Video Editing

* ICT Quiz

Important modules required:

* Competition registration tracking

* Submission tracking

* PR campaign

* Sponsor tracking

* Budget tracking

* ICT Day event mode

* Awarding checklist

* Guest management

* Venue planning

Key event:

* ICT Day at BMICH Lotus Room

Suggested key milestones:

* Competition registration opens

* Registration deadline

* Submission deadline

* Quiz finalists selected

* Venue finalized

* Event agenda finalized

* Awards and certificates prepared

* ICT Day completed

* Final report archived

---

## 11.2 SparkIT’26

Project type: Outreach / Workshop / Network Building

Main structure:

* Phase 1: SparkIT Flash

* Phase 2: SparkIT Fusion

* Phase 3: SparkIT Family

Important modules required:

* Session planning

* School selection

* Speaker tracking

* Resource donation tracking

* Workshop agenda

* Partner organization tracking

* Budget tracking

* Attendance

* Mentorship follow-up

Suggested key milestones:

* Flash session calendar finalized

* Speakers confirmed

* Fusion schools shortlisted

* Resource packages finalized

* Workshop agenda confirmed

* Event day completed

* SparkIT Family invitation sent

* Monthly mentorship cycle started

---

## 11.3 Tesseract’26

Project type: Educational Workshop / Seminar Series

Main structure:

* Phase 1: Educational Workshop Series

* Phase 2: Educational Seminar Series

Important modules required:

* Session scheduling

* Speaker management

* Registration

* Attendance

* Resource sharing

* PR calendar

* Online session links

* Recording archive

Suggested key milestones:

* Workshop topics finalized

* Speakers confirmed

* PR campaign launched

* Session registration opened

* Session conducted

* Materials uploaded

* Feedback collected

---

## 11.4 Royal College Sports App

Project type: Software Product / Sports Coverage

Important modules required:

* Product roadmap

* Feature tracking

* Bug tracking

* Match coverage calendar

* Live coverage assignments

* Release checklist

* App update planning

Features mentioned for tracking:

* Events Calendar

* AR Click

* Player Profiles

* Match Highlights

* Live Win Prediction

* AI Match Summary

* Live Activities and Dynamic Island

Suggested key milestones:

* Feature planning

* UI design

* Backend development

* Testing

* App release

* Event coverage readiness

* Post-match report

---

## 11.5 Digitalizer’26

Project type: Internal Systems / School Digital Transformation

Main structure:

* Member Management System

* Digital Notice Board

* Digital Sponsorship Platform

* Venue Booking System

* Website and IT Solutions

Important modules required:

* Software development roadmap

* Stakeholder approvals

* Feature tracking

* Testing

* Deployment

* Maintenance

* Documentation

Suggested key milestones:

* Requirements finalized

* UI/UX approved

* Development started

* Testing completed

* Deployment completed

* Documentation submitted

---

## 11.6 The Syntax Technological Publication

Project type: Publication / Digital Magazine

Important modules required:

* Article submission tracking

* Editorial workflow

* Design workflow

* Sponsor ad tracking

* Launch planning

* Distribution tracking

Suggested key milestones:

* Article submissions open

* Submission deadline

* Article selection

* Editing completed

* Design completed

* Sponsor ads added

* Final magazine exported

* Launch at BTUI

---

## 11.7 PROTOX’26

Project type: Hackathon / Prototype Competition / Conference

Important modules required:

* School registration

* Prototype submission

* Shortlisting

* Hackathon planning

* Mentor tracking

* Judging criteria

* Final presentation schedule

* Awards

Suggested key milestones:

* Registration opens

* Prototype submission deadline

* Teams shortlisted

* Hackathon agenda finalized

* Judges confirmed

* Final judging completed

* Awards completed

* Final report archived

---

## 12\. User Stories

## 12.1 Executive Committee

As an executive committee member, I want to see all active projects in one dashboard so that I can quickly identify what needs attention.

As a secretary, I want meeting decisions to become tasks so that decisions do not disappear after meetings.

As a chairman, I want to see delayed milestones so that I can intervene before a project fails.

As a treasurer, I want project-wise budgets and expenses so that financial tracking is clear.

---

## 12.2 Project Head

As a project head, I want to break my project into phases and milestones so that the team understands the full path from beginning to end.

As a project head, I want to assign owners to deliverables so that responsibility is clear.

As a project head, I want weekly progress summaries so that I can report to the executive committee easily.

---

## 12.3 PR Team

As a PR team member, I want a calendar view of all upcoming posts so that we can avoid last-minute chaos.

As a designer, I want to attach Canva/Figma links to PR tasks so that reviewers can access designs easily.

As an editor, I want caption approval status so that posts are not published without review.

---

## 12.4 Sponsorship Team

As a sponsorship team member, I want to track each sponsor from lead to payment so that no sponsor follow-up is forgotten.

As a project treasurer, I want to see confirmed sponsor income so that the budget can be updated accurately.

---

## 12.5 General Member

As a member, I want to see only my assigned tasks so that I know what I need to do.

As a volunteer, I want reminders before deadlines so that I do not miss work.

---

## 13\. Core Workflows

# 13.1 Project Creation Workflow

1. Executive creates new project.

2. Adds project name, type, description, dates, and owners.

3. Uploads or links project proposal.

4. Adds phases.

5. Adds milestones.

6. Adds committee members.

7. Adds budget estimate.

8. Adds PR campaign plan.

9. Marks project as Planning.

10. After approval, marks project as Active.

---

# 13.2 PR Workflow

1. PR lead creates campaign.

2. Adds content items to calendar.

3. Assigns designer and caption writer.

4. Designer adds design link.

5. Caption writer adds caption.

6. Editor reviews.

7. Project head approves.

8. Teacher approval is requested if needed.

9. Post is scheduled.

10. Post is marked as Posted.

11. Link to published post is added.

---

# 13.3 Meeting Workflow

1. Meeting is scheduled.

2. Agenda is added.

3. Attendance is marked.

4. Decisions are recorded.

5. Action items are added.

6. Action items automatically become tasks.

7. Tasks are assigned to members.

8. Meeting summary is saved.

9. Next meeting is scheduled.

---

# 13.4 Sponsorship Workflow

1. Sponsor lead is added.

2. Sponsorship team contacts sponsor.

3. Proposal is sent.

4. Follow-up date is added.

5. Meeting is recorded.

6. Sponsor is marked as confirmed or rejected.

7. Payment is tracked.

8. Sponsor deliverables are assigned.

9. Sponsor appreciation post is scheduled.

10. Sponsor record is completed.

---

# 13.5 Event-Day Workflow

1. Project switches to Event-Day Mode.

2. Event agenda becomes live timeline.

3. Each team marks readiness.

4. Issues are logged in real time.

5. Completed agenda items are marked.

6. Photos and event records are uploaded.

7. Event is marked completed.

8. Post-event review is created.

---

## 14\. MVP Requirements

The MVP should focus on the features that prevent RCCS from getting lost midway.

## MVP Feature List

Priority 0:

* Login and roles

* Project dashboard

* Project workspace

* Phases and milestones

* Task management

* Calendar view

* PR planner

* Member assignment

* Meeting notes

* Basic file links

* Basic approval status

Priority 1:

* Sponsor CRM

* Budget tracking

* Risk tracker

* Event-day checklist

* Reports

* Notifications

Priority 2:

* Analytics

* AI summaries

* Mobile app

* Public registration portal

* Advanced finance

* Google Calendar integration

* WhatsApp reminders

* GitHub integration

---

## 15\. Roles and Permissions

## 15.1 Super Admin

Can:

* Manage all users

* Manage all projects

* Change system settings

* Archive projects

* View all data

Usually:

* Secretary

* Chairman

* System administrator

## 15.2 Executive Admin

Can:

* View all projects

* Approve major items

* Create projects

* Assign project heads

* View finance summaries

## 15.3 Project Admin

Can:

* Manage assigned project

* Add phases

* Add milestones

* Assign tasks

* Manage meetings

* Manage project files

## 15.4 Team Lead

Can:

* Manage tasks in assigned team

* Update deliverables

* Add comments

* Request approvals

## 15.5 Member

Can:

* View assigned tasks

* Update task status

* Comment

* Upload files

* View relevant project details

## 15.6 Viewer

Can:

* View selected project information

* Cannot edit

Usually:

* Teachers-in-charge

* Past members

* External advisors

---

## 16\. Notifications

The system should notify users about:

* Task assigned

* Deadline approaching

* Deadline missed

* Approval requested

* Approval completed

* Meeting scheduled

* Meeting action item assigned

* PR post due soon

* Sponsor follow-up due

* Budget alert

* Event-day issue

Notification channels:

MVP:

* In-app notifications

* Email notifications

Later:

* WhatsApp reminders

* Push notifications

---

## 17\. Search Requirements

The system should have global search.

Users should be able to search:

* Project names

* Tasks

* Members

* Sponsors

* Files

* Meeting decisions

* PR posts

* Budget items

* Risks

Example searches:

* “BTUI sponsor”

* “SparkIT robotics”

* “registration poster”

* “BMICH”

* “certificates”

* “pending approval”

---

## 18\. Reports

The system should generate:

* Weekly project summary

* Overdue task report

* PR calendar report

* Budget report

* Sponsor status report

* Member contribution report

* Meeting action item report

* Event readiness report

* Final project report

Final project report should include:

* Project overview

* Objectives

* Timeline

* Committee

* Budget

* Sponsors

* PR summary

* Completed deliverables

* Issues faced

* Final outcome

* Recommendations

---

## 19\. Success Metrics

The system is successful if:

* 90% of RCCS projects are tracked inside the system.

* Every active project has phases and milestones.

* PR posts are scheduled at least 3 days before publishing.

* Meeting action items are assigned within 24 hours.

* Sponsor follow-ups are not missed.

* Final project reports are easier to create.

* Future committees can understand past projects without asking older members.

* Fewer deadlines are missed.

* Members clearly know what they are responsible for.

---

## 20\. Non-Functional Requirements

## 20.1 Usability

The system must be simple enough for a new member to understand within 10 minutes.

Design principles:

* Clean interface

* Minimal clutter

* Large clear buttons

* Calendar-first navigation

* Mobile-friendly

* Fast task updates

* Avoid enterprise-style complexity

## 20.2 Performance

The system should load dashboards quickly.

Target:

* Dashboard load under 3 seconds

* Calendar load under 3 seconds

* Task update under 1 second

## 20.3 Security

The system should protect:

* Member contact details

* Sponsor details

* Financial records

* Internal documents

* Teacher approvals

Security requirements:

* Role-based access

* Secure login

* Data backups

* Audit log for important changes

## 20.4 Reliability

The system should not lose project data.

Requirements:

* Regular backups

* Version history for important documents

* Soft delete instead of permanent delete

* Activity log

## 20.5 Mobile Support

The system should work well on phones because many members will update tasks through mobile devices.

---

## 21\. Suggested Database Entities

Core entities:

* User

* MemberProfile

* Project

* Phase

* Milestone

* Deliverable

* Task

* SubTask

* CalendarEvent

* PRCampaign

* PRItem

* Meeting

* MeetingDecision

* ActionItem

* Sponsor

* SponsorContact

* SponsorPackage

* Budget

* Transaction

* FileLink

* ApprovalRequest

* Risk

* EventChecklist

* Notification

* ActivityLog

---

## 22\. Suggested Tech Stack

Recommended stack:

Frontend:

* Next.js

* Tailwind CSS

* ShadCN UI

Backend:

* Supabase

* PostgreSQL

* Supabase Auth

* Supabase Storage

Calendar:

* FullCalendar.js

Optional later:

* Resend for email notifications

* WhatsApp Cloud API for reminders

* Google Drive API

* Google Calendar API

* GitHub integration

* Vercel deployment

Reason:

This stack is fast to build, student-friendly, affordable, and suitable for a school society project.

---

## 23\. Iterative Development Plan

## Version 0.1: Foundation

Build:

* Login

* User roles

* Project creation

* Project dashboard

* Basic task management

Goal:

Allow RCCS to enter projects and assign work.

---

## Version 0.2: Project Structure

Build:

* Phases

* Milestones

* Deliverables

* Project progress tracking

Goal:

Make projects understandable from start to end.

---

## Version 0.3: Calendar and PR

Build:

* Full calendar view

* PR planner

* PR approval status

* Content scheduling

Goal:

Solve PR chaos and date-sensitive planning.

---

## Version 0.4: Meetings and Approvals

Build:

* Meeting notes

* Action items

* Approval requests

Goal:

Convert discussions into trackable work.

---

## Version 0.5: Sponsorship and Budget

Build:

* Sponsor CRM

* Budget tracker

* Expense tracker

Goal:

Track money and sponsor commitments clearly.

---

## Version 0.6: Event-Day Mode

Build:

* Event checklist

* Live agenda

* Team readiness status

Goal:

Help RCCS manage physical events smoothly.

---

## Version 1.0: RCCS Annual Operations Platform

Build:

* Reports

* Archive

* Search

* Notifications

* Member contribution tracking

Goal:

Make the system ready for full RCCS yearly operations.

---

## 24\. Key Design Decision

The system must be designed around this question:

“What needs to happen next, who owns it, and when must it be done?”

Every screen should help answer that.

Avoid unnecessary complexity such as:

* Story points

* Sprint velocity

* Complicated issue types

* Too many statuses

* Developer-only language

* Enterprise dashboards

Use RCCS-friendly language instead:

* Project

* Phase

* Milestone

* Task

* PR Post

* Sponsor

* Meeting

* Approval

* Event Day

* Report

---

## 25\. Final Product Goal

By the end of development, RCCS Command Center should become the official internal operations system of the Royal College Computer Society.

It should help every project move from:

Idea  
→ Proposal  
→ Approval  
→ Planning  
→ Execution  
→ Event/Launch  
→ Reporting  
→ Archive

without losing information, deadlines, decisions, or responsibility midway.

The system should not only manage projects.

It should preserve RCCS memory.