import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ImageUploader from './ImageUploader';
import VoiceRecorder from './VoiceRecorder';

// GRD Section 6.4 — Step 4 (was Step 3): Charges & Media
// Change 6A: BOTH in-warranty AND out-of-warranty complaints use preset + petrol + extras.
// SC gets paid preset + petrol + approved extras from Microvison in ALL cases.
// For OOW: customer payments are recorded separately in the complaint detail panel
// and deducted from what Microvison owes the SC.

