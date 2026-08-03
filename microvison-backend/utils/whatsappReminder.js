const Complaint = require('../models/Complaint');
const ServiceCentre = require('../models/ServiceCentre');
const sendWhatsApp = require('./sendWhatsApp');

const getCustomerAddress = (complaint) =>
    `${complaint.localAddress}, ${complaint.city}, ${complaint.district}, ${complaint.state}`;

const WA_PRODUCT_LABELS = {
    led: 'LED TV',
    cooler: 'Cooler',
    washing_machine: 'Washing Machine',
    induction: 'Induction Stove',
};

const getProduct = (complaint) =>
    WA_PRODUCT_LABELS[complaint.product] || complaint.product || 'N/A';

const getRequestType = (complaint) =>
    complaint.complaintType === 'installation' ? 'Installation' : 'Complaint';

const getPortalUrl = () =>
    process.env.PORTAL_LOGIN_URL || 'https://www.microvisonservice.co.in/';

const runWAReminderCron = async () => {
    console.log(`[WhatsApp Cron] Starting WhatsApp reminders check at ${new Date().toISOString()}`);

    try {
        // ─────────────────────────────────────────────────────────────────────────
        // 1. WA-03: sc_assignment_reminder
        // Condition: status === 'assigned'
        // Timers: First at 23.5h, then every 47.5h loop
        // ─────────────────────────────────────────────────────────────────────────
        const assignedComplaints = await Complaint.find({ status: 'assigned' })
            .populate('assignedCentreId');

        for (const c of assignedComplaints) {
            const sc = c.assignedCentreId;
            if (!sc || sc.isUnregistered === true || !sc.phone1) continue;

            const hoursSinceAssigned = (Date.now() - new Date(c.assignedAt).getTime()) / (1000 * 60 * 60);
            const lastSent = c.scAssignmentReminderSentAt;
            const hoursSinceLastSent = lastSent
                ? (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60)
                : null;

            const shouldSendFirst = !lastSent && hoursSinceAssigned >= 23.5;
            const shouldSendLoop = lastSent && hoursSinceLastSent >= 47.5;

            if (shouldSendFirst || shouldSendLoop) {
                const templateName = process.env.WHATSAPP_TEMPLATE_ASSIGNMENT_REMINDER || 'sc_assignment_reminder';

                console.log(`[WhatsApp Cron] Sending ${templateName} to ${sc.businessName} (${sc.phone1}) for ${c.complaintId}`);

                await sendWhatsApp(sc.phone1, templateName, [
                    getRequestType(c),        // {{1}} Request Type (Installation / Complaint)
                    c.complaintId,            // {{2}} Complaint ID
                    getProduct(c),            // {{3}} Product
                    c.customerName,           // {{4}} Customer Name
                    getCustomerAddress(c),    // {{5}} Customer Address (localAddress, city, district, state)
                    getPortalUrl()            // {{6}} Portal Link
                ]);

                c.scAssignmentReminderSentAt = new Date();
                await c.save();
            }
        }
        // ─────────────────────────────────────────────────────────────────────────
        // 2. WA-04B: sc_post_accept_reminder
        // Condition: status === 'accepted'
        // Timers: First at 23.5h, then every 47.5h loop
        // ─────────────────────────────────────────────────────────────────────────
        const acceptedComplaints = await Complaint.find({ status: 'accepted' })
            .populate('assignedCentreId');

        for (const c of acceptedComplaints) {
            const sc = c.assignedCentreId;
            if (!sc || sc.isUnregistered === true || !sc.phone1) continue;

            // Note: SC updates scAcceptedAt on accept, verify fallback to updatedAt just in case
            const acceptTime = c.scAcceptedAt || c.updatedAt;
            const hoursSinceAccepted = (Date.now() - new Date(acceptTime).getTime()) / (1000 * 60 * 60);
            const lastSent = c.scPostAcceptReminderSentAt;
            const hoursSinceLastSent = lastSent
                ? (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60)
                : null;

            const shouldSendFirst = !lastSent && hoursSinceAccepted >= 23.5;
            const shouldSendLoop = lastSent && hoursSinceLastSent >= 47.5;

            if (shouldSendFirst || shouldSendLoop) {
                const templateName = process.env.WHATSAPP_TEMPLATE_POST_ACCEPT_REMINDER || 'sc_post_accept_reminder';

                console.log(`[WhatsApp Cron] Sending ${templateName} to ${sc.businessName} (${sc.phone1}) for ${c.complaintId}`);

                await sendWhatsApp(sc.phone1, templateName, [
                    getRequestType(c),        // {{1}} Request Type (Installation / Complaint)
                    c.complaintId,            // {{2}} Complaint ID
                    getProduct(c),            // {{3}} Product
                    c.customerName,           // {{4}} Customer Name
                    getCustomerAddress(c),    // {{5}} Customer Address
                    getPortalUrl()            // {{6}} Portal Link
                ]);

                c.scPostAcceptReminderSentAt = new Date();
                await c.save();
            }
        }
        // ─────────────────────────────────────────────────────────────────────────
        // 3. WA-05: sc_not_done_reminder
        // Condition: status === 'not_done'
        // Timers: First at 23.5h, then every 47.5h loop
        // ─────────────────────────────────────────────────────────────────────────
        const notDoneComplaints = await Complaint.find({ status: 'not_done' })
            .populate('assignedCentreId');

        for (const c of notDoneComplaints) {
            const sc = c.assignedCentreId;
            if (!sc || sc.isUnregistered === true || !sc.phone1) continue;

            const notDoneTime = c.notDoneAt || c.updatedAt;
            const hoursSinceNotDone = (Date.now() - new Date(notDoneTime).getTime()) / (1000 * 60 * 60);
            const lastSent = c.scNotDoneReminderSentAt;
            const hoursSinceLastSent = lastSent
                ? (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60)
                : null;

            const shouldSendFirst = !lastSent && hoursSinceNotDone >= 23.5;
            const shouldSendLoop = lastSent && hoursSinceLastSent >= 47.5;

            if (shouldSendFirst || shouldSendLoop) {
                const templateName = process.env.WHATSAPP_TEMPLATE_NOT_DONE_REMINDER || 'sc_not_done_reminder';

                console.log(`[WhatsApp Cron] Sending ${templateName} to ${sc.businessName} (${sc.phone1}) for ${c.complaintId}`);

                await sendWhatsApp(sc.phone1, templateName, [
                    c.complaintId,            // {{1}} Complaint ID
                    getProduct(c),            // {{2}} Product
                    c.customerName,           // {{3}} Customer Name
                    getCustomerAddress(c),    // {{4}} Customer Address
                    getPortalUrl()            // {{5}} Portal Link
                ]);

                c.scNotDoneReminderSentAt = new Date();
                await c.save();
            }
        }
        // ─────────────────────────────────────────────────────────────────────────
        // 4. WA-07: sc_part_received_reminder
        // Condition: status === 'part_pending' && partReceivedAt !== null
        // Timers: First at 23.5h, then every 47.5h loop
        // ─────────────────────────────────────────────────────────────────────────
        const partReceivedComplaints = await Complaint.find({
            status: 'part_pending',
            partReceivedAt: { $ne: null }
        }).populate('assignedCentreId');

        for (const c of partReceivedComplaints) {
            const sc = c.assignedCentreId;
            if (!sc || sc.isUnregistered === true || !sc.phone1) continue;

            const hoursSinceReceived = (Date.now() - new Date(c.partReceivedAt).getTime()) / (1000 * 60 * 60);
            const lastSent = c.scPartReceivedReminderSentAt;
            const hoursSinceLastSent = lastSent
                ? (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60)
                : null;

            const shouldSendFirst = !lastSent && hoursSinceReceived >= 23.5;
            const shouldSendLoop = lastSent && hoursSinceLastSent >= 47.5;

            if (shouldSendFirst || shouldSendLoop) {
                const templateName = process.env.WHATSAPP_TEMPLATE_PART_RECEIVED_REMINDER || 'sc_part_received_reminder';

                console.log(`[WhatsApp Cron] Sending ${templateName} to ${sc.businessName} (${sc.phone1}) for ${c.complaintId}`);

                await sendWhatsApp(sc.phone1, templateName, [
                    c.complaintId,            // {{1}} Complaint ID
                    getProduct(c),            // {{2}} Product
                    c.customerName,           // {{3}} Customer Name
                    getCustomerAddress(c),    // {{4}} Customer Address
                    getPortalUrl()            // {{5}} Portal Link
                ]);

                c.scPartReceivedReminderSentAt = new Date();
                await c.save();
            }
        }

    } catch (err) {
        console.error(`[WhatsApp Cron] Error during WhatsApp reminders check:`, err);
    }

    console.log(`[WhatsApp Cron] Completed WhatsApp reminders check.`);
};

module.exports = runWAReminderCron;