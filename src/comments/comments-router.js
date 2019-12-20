const express = require('express');
const xss = require('xss');
const ImagesService = require('../images/images-service');
const CommentsService = require('./comments-service');
const commentsRouter = express.Router();
const jsonParser = express.json();
const { protectedWithJWT } = require('../middleware/token-auth');

const sanitizedComment = (comment) => ({
  comment_id: comment.comment_id,
  comment_text: xss(comment.comment_text),
  comment_timestamp: comment.comment_timestamp,
  submission_id: comment.submission_id,
  user_id: comment.user_id,
});

/*****************************************************************
  /api/comments/:submission_id
******************************************************************/
commentsRouter
  .route('/:submission_id')
  .all(async (req, res, next) => {
    const submission = await ImagesService.getSingleSubmission(
      req.app.get('db'),
      req.params.submission_id
    );
    if (!submission) {
      return res.status(404).json({
        error: { message: 'Submission does not exist' },
      });
    }
    res.submission = submission; // save the submission for the next middleware
    next(); // don't forget to call next so the next middleware happens!
  })
  .get(async (req, res, next) => {
    try {
      const comments = await CommentsService.getAllComments(
        req.app.get('db'),
        res.submission.id
      );
      return res.json(comments.map(sanitizedComment));
    } catch (error) {
      next(error);
    }
  })
  .post(protectedWithJWT, jsonParser, async (req, res, next) => {
    const { comment_text, user_id, comment_timestamp } = req.body;
    const comment = { comment_text, user_id };

    for (const [key, value] of Object.entries(comment)) {
      if (!value) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    comment.submission_id = res.submission.id;
    comment.comment_timestamp = comment_timestamp;

    try {
      const _comment = await CommentsService.createComment(req.app.get('db'), comment);
      return res.status(201).json(sanitizedComment(_comment));
    } catch (error) {
      next(error);
    }
  });

module.exports = commentsRouter;
