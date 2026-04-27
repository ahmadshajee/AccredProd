const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../models/db');

async function registerInstitution(req, res) {
  try {
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ message: 'Institution name and domain are required.' });
    }

    const users = await readCollection('users');
    const institutions = await readCollection('institutions');
    const currentUser = users.find((entry) => entry.id === req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: 'Institution user not found.' });
    }

    if (currentUser.institutionId) {
      const existingInstitution = institutions.find(
        (entry) => entry.id === currentUser.institutionId
      );

      if (existingInstitution) {
        return res.status(409).json({ message: 'Institution profile already submitted.' });
      }
    }

    const normalizedDomain = String(domain).trim().toLowerCase();
    const duplicateInstitution = institutions.find((entry) => entry.domain === normalizedDomain);

    if (duplicateInstitution) {
      return res.status(409).json({ message: 'An institution with this domain already exists.' });
    }

    const institution = {
      id: uuidv4(),
      name: String(name).trim(),
      domain: normalizedDomain,
      status: 'pending',
      registeredBy: req.user.id,
      createdAt: new Date().toISOString(),
    };

    institutions.push(institution);
    currentUser.institutionId = institution.id;

    await Promise.all([
      writeCollection('institutions', institutions),
      writeCollection('users', users),
    ]);

    return res.status(201).json({
      message: 'Institution submitted for admin approval.',
      institution,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to register institution.' });
  }
}

async function listInstitutions(_req, res) {
  try {
    const institutions = await readCollection('institutions');
    return res.json({ institutions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch institutions.' });
  }
}

async function approveInstitution(req, res) {
  try {
    const { id } = req.params;
    const institutions = await readCollection('institutions');
    const institution = institutions.find((entry) => entry.id === id);

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found.' });
    }

    institution.status = 'approved';
    await writeCollection('institutions', institutions);

    return res.json({ message: 'Institution approved successfully.', institution });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to approve institution.' });
  }
}

async function rejectInstitution(req, res) {
  try {
    const { id } = req.params;
    const institutions = await readCollection('institutions');
    const institution = institutions.find((entry) => entry.id === id);

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found.' });
    }

    institution.status = 'rejected';
    await writeCollection('institutions', institutions);

    return res.json({ message: 'Institution rejected successfully.', institution });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to reject institution.' });
  }
}

module.exports = {
  registerInstitution,
  listInstitutions,
  approveInstitution,
  rejectInstitution,
};
