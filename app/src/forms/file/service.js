const config = require('config');
const { v4: uuidv4 } = require('uuid');

const { FileStorage, FileStorageReservation } = require('../common/models');
const emailService = require('../email/emailService');
const storageService = require('./storage/storageService');

const PERMANENT_STORAGE = config.get('files.permanent');

const service = {

  create: async (data, currentUser) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();

      const obj = {};
      obj.id = uuidv4();
      obj.storage = 'uploads';
      obj.originalName = data.originalname;
      obj.mimeType = data.mimetype;
      obj.size = data.size;
      obj.path = data.path;
      obj.createdBy = currentUser.usernameIdp;

      const uploadResult = await storageService.upload(obj);
      obj.path = uploadResult.path;
      obj.storage = uploadResult.storage;

      await FileStorage.query(trx).insert(obj);

      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  createData: async (formId, reservationId, metadata, data, currentUser, referer) => {
    let trx;
    let uploadResult;
    try {
      trx = await FileStorage.startTransaction();

      const obj = {};
      obj.id = uuidv4();
      obj.storage = 'temp';
      obj.originalName = metadata.originalName;
      obj.mimeType = metadata.mimetype;
      obj.size = metadata.size;
      obj.createdBy = currentUser.usernameIdp;
      uploadResult = await storageService.uploadData(obj, data);
      obj.path = uploadResult.path;
      obj.storage = uploadResult.storage;

      await FileStorage.query(trx).insert(obj);

      const reservation = await FileStorageReservation.query(trx)
        .patchAndFetchById(reservationId, {
          fileId: obj.id,
          ready: true,
        });

      await trx.commit();

      await emailService.submissionsExportReady(formId, reservation, { to: currentUser.email }, referer);

      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      if (uploadResult && uploadResult.path) await storageService.delete({ path: uploadResult.path });
      throw err;
    }
  },

  read: async (id) => {
    return FileStorage.query()
      .findById(id)
      .throwIfNotFound();
  },

  delete: async (id) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();
      const obj = await service.read(id);

      await FileStorage.query(trx)
        .deleteById(id)
        .throwIfNotFound();

      const result = await storageService.delete(obj);
      if (!result) {
        // error?
      }
      await trx.commit();
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  moveSubmissionFiles: async (submissionId, currentUser) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();

      // fetch all the File Storage records for a submission id
      // move them to permanent storage
      // update their new paths.
      const items = await FileStorage.query(trx).where('formSubmissionId', submissionId);

      for (const item of items) {
        // move the files under a sub directory for this submission
        const newPath = await storageService.move(item, 'submissions', submissionId);
        if (!newPath) {
          throw new Error('Error moving files for submission');
        }
        await FileStorage.query(trx).patchAndFetchById(item.id, {
          storage: PERMANENT_STORAGE,
          path: newPath,
          updatedBy: currentUser.usernameIdp
        });
      }
      await trx.commit();
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  }

};

module.exports = service;
