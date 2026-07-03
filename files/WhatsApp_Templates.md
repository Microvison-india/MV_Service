# Microvison WhatsApp Meta Templates

This file contains the exact Body text to be copy-pasted into the Meta WhatsApp Manager when creating templates.

## 1. `customer_sc_assigned` (⏳ Verification Pending)
- **Category:** Utility
- **Language:** English
- **Recipient:** Customer

```text
*Microvison Service Update* 🛠️

Hello! Your {{3}} request for your {{2}} (Complaint ID: {{1}}) has been assigned to a service centre.

*Service Centre Details:*
🏢 Name: {{4}}
📞 Contact: {{5}}

They have accepted your request and will visit you soon. 

For any further assistance, please contact our Microvison Support Number: {{6}}

Thank you for choosing *Microvison*!
```

**Sample Data:**
- **{{1}}** `MV-C-12345` *(Complaint ID)*
- **{{2}}** `LED TV` *(Product)*
- **{{3}}** `Installation` *(Request Type)*
- **{{4}}** `FixIt Fast` *(SC Business Name)*
- **{{5}}** `9876543210` *(SC Phone)*
- **{{6}}** `1800-123-4567` *(Support Number)*

## 2. `sc_new_assignment` (⏳ Verification Pending)
> **⚠️ REMINDER:** After this is approved, EDIT it in Meta to replace "complaint" with "service request" (i.e., "A new service request has been assigned to your service centre.") and re-submit.
- **Category:** Utility
- **Language:** English
- **Recipient:** Service Centre

```text
*NEW SERVICE REQUEST* 🚨

Hello from *Microvison*! A new service request has been assigned to your service centre.

*Customer Details:*
👤 Name: {{1}}
📞 Phone: {{2}}
📍 Address: {{3}}

*Product & Issue Info:*
📦 Product: {{4}}
⚙️ Request Type: {{5}}
🛡️ Warranty: {{6}}
🔢 Serial No: {{7}}

*Complaint ID:* {{8}}

Please log in to your portal to Accept or Reject this request: {{9}}

Thank you,
Microvison Support Team
```

**Sample Data:**
- **{{1}}** `John Doe` *(Customer Name)*
- **{{2}}** `9876543210` *(Customer Phone)*
- **{{3}}** `123 Main Street, Delhi` *(Customer Address)*
- **{{4}}** `LED TV` *(Product)*
- **{{5}}** `Installation` *(Request Type)*
- **{{6}}** `Under Warranty` *(Warranty)*
- **{{7}}** `SN-987654321` *(Serial No)*
- **{{8}}** `MV-C-12345` *(Complaint ID)*
- **{{9}}** `https://microvisonservice.co.in/sc-portal` *(Portal Link)*

## 3. `sc_assignment_reminder` (⏳ Verification Pending)
> **⚠️ REMINDER:** After this is approved, EDIT it in Meta to add the request type variable `{{1}}` (i.e., "You have a pending {{1}} assignment...") and shift the rest of the variables, then re-submit.
- **Category:** Utility
- **Language:** English
- **Recipient:** Service Centre

```text
*ACTION REQUIRED - PENDING ASSIGNMENT* ⚠️

Hello from *Microvison*! You have a pending {{1}} assignment that requires your attention. 

*Complaint ID:* {{2}}
*Product:* {{3}}
*Customer Name:* {{4}}
*Customer Address:* {{5}}

Please log in to your Microvison portal immediately to Accept or Reject this request so we can update the customer.

Portal Link: {{6}}

Thank you,
Microvison Support Team
```

**Sample Data:**
- **{{1}}** `Installation` *(or Complaint - Request Type)*
- **{{2}}** `MV-C-12345` *(Complaint ID)*
- **{{3}}** `LED TV` *(Product)*
- **{{4}}** `John Doe` *(Customer Name)*
- **{{5}}** `123 Main Street, Delhi` *(Customer Address)*
- **{{6}}** `https://microvisonservice.co.in/sc-portal` *(Portal Link)*

## 4. `sc_post_accept_reminder` (⏳ Verification Pending)
- **Category:** Utility
- **Language:** English
- **Recipient:** Service Centre

```text
*ACTION REQUIRED - STATUS UPDATE PENDING* ⚠️

Hello from *Microvison*! You accepted a {{1}} assignment but haven't updated its status. Please visit the customer or update the portal.

*Complaint ID:* {{2}}
*Product:* {{3}}
*Customer Name:* {{4}}
*Customer Address:* {{5}}

Please log in to your Microvison portal immediately to update the status of this request.

Portal Link: {{6}}

Thank you,
Microvison Support Team
```

**Sample Data:**
- **{{1}}** `Installation` *(or Complaint - Request Type)*
- **{{2}}** `MV-C-12345` *(Complaint ID)*
- **{{3}}** `LED TV` *(Product)*
- **{{4}}** `John Doe` *(Customer Name)*
- **{{5}}** `123 Main Street, Delhi` *(Customer Address)*
- **{{6}}** `https://microvisonservice.co.in/sc-portal` *(Portal Link)*

## 5. `sc_not_done_reminder` (⏳ Verification Pending)
- **Category:** Utility
- **Language:** English
- **Recipient:** Service Centre

```text
*ACTION REQUIRED - UNRESOLVED REQUEST* ⚠️

Hello from *Microvison*! You visited a customer but marked the job as "Not Done". This request is still open and requires your attention to finish the job.

*Complaint ID:* {{1}}
*Product:* {{2}}
*Customer Name:* {{3}}
*Customer Address:* {{4}}

Please log in to your Microvison portal to update the status once the issue is resolved.

Portal Link: {{5}}
Thank you,
Microvison Support Team
```

**Sample Data:**
- **{{1}}** `MV-C-12345` *(Complaint ID)*
- **{{2}}** `LED TV` *(Product)*
- **{{3}}** `John Doe` *(Customer Name)*
- **{{4}}** `123 Main Street, Delhi` *(Customer Address)*
- **{{5}}** `https://microvisonservice.co.in/sc-portal` *(Portal Link)*

## 6. `sc_part_dispatched` (⏳ Verification Pending)
- **Category:** Utility
- **Language:** English
- **Recipient:** Service Centre

```text
*PART DISPATCHED* 📦

Hello from *Microvison*! A spare part for a pending request has been dispatched to your service centre.

*Complaint ID:* {{1}}
*Customer Name:* {{2}}
*Customer Address:* {{3}}

*Admin Note:* {{4}}

Please log in to your Microvison portal to track this request. Mark it as "Received" once the part arrives.

Portal Link: {{5}}

Thank you,
Microvison Support Team
```

**Sample Data:**
- **{{1}}** `MV-C-12345` *(Complaint ID)*
- **{{2}}** `John Doe` *(Customer Name)*
- **{{3}}** `123 Main Street, Delhi` *(Customer Address)*
- **{{4}}** `Dispatched via DTDC tracking #123456` *(Admin Note)*
- **{{5}}** `https://microvisonservice.co.in/sc-portal` *(Portal Link)*

## 7. `sc_part_received_reminder` (⏳ Verification Pending)
- **Category:** Utility
- **Language:** English
- **Recipient:** Service Centre

```text
*ACTION REQUIRED - PENDING PART INSTALLATION* ⚠️

Hello from *Microvison*! You recently marked a spare part as "Received", but haven't updated the request status. 

*Complaint ID:* {{1}}
*Product:* {{2}}
*Customer Name:* {{3}}
*Customer Address:* {{4}}

Please visit the customer to install the part and log in to your Microvison portal to update the status of this request.

Portal Link: {{5}}

Thank you,
Microvison Support Team
```

**Sample Data:**
- **{{1}}** `MV-C-12345` *(Complaint ID)*
- **{{2}}** `LED TV` *(Product)*
- **{{3}}** `John Doe` *(Customer Name)*
- **{{4}}** `123 Main Street, Delhi` *(Customer Address)*
- **{{5}}** `https://microvisonservice.co.in/sc-portal` *(Portal Link)*