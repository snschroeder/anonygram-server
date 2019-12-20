const CommentsService = {
  getAllComments(db, submission_id) {
    return db
      .select('comment_id', 'comment_text', 'comment_timestamp', 'submission_id', 'comments.user_id')
      .from('comments')
      .join('submission', 'submission.id', 'comments.submission_id')
      .join('users', 'users.id', 'comments.user_id')
      .where({ submission_id });
  },

  createComment(db, comment) {
    return db
      .insert(comment)
      .into('comments')
      .returning('*')
      .then((rows) => {
        return rows[0];
      });
  },
};

module.exports = CommentsService;
