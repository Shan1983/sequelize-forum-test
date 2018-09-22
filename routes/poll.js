const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const {
  PollAnswer,
  PollQuestion,
  PollVote,
  User,
  Sequelize,
  Thread
} = require("../models");

// AUTH
// router.all("*", (req, res, next) => {
//   if (req.session.loggedIn) {
//     next();
//   } else {
//     res.status(401);
//     res.json({
//       errors: [Errors.requestNotAuthorrized]
//     });
//   }
// });

// GET - poll results
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const pollQuestion = await PollQuestion.findById(id, {
      include: [
        { model: User, attributes: { exclude: ["hash"] } },
        { model: PollAnswer, include: [PollVote] }
      ]
    });

    if (!pollQuestion) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "invalid poll id",
        value: id
      });
    }

    // get the total votes
    const totalVotes = PollQuestion.PollAnswers.reduce((sum, answer) => {
      return sum + answer.PollVotes.length;
    }, 0);

    // get the poll answers and their percentage
    const answerWithPercent = pollQuestion.PollAnswers.map(ans => {
      const jsonAnswer = ans.toJSON();
      const percent = ans.PollVotes.length / totalVotes;
      jsonAnswer.percent = Math.round(percent * 100 * 10) / 10;
      return jsonAnswer;
    });

    // get the users who voted in the poll
    const hasVoted = await PollVote.findOne({
      where: {
        UserId: req.session.UserId,
        PollQuestionId: id
      }
    });

    // build the response
    let jsonPollQuestion = pollQuestion.toJSON();
    jsonPollQuestion.totalVotes = totalVotes;
    jsonPollQuestion.PollAnswers = answerWithPercent;
    jsonPollQuestion.hasVoted = !!hasVoted;

    res.json(jsonPollQuestion);
  } catch (e) {
    next(e);
  }
});

// POST - create a new poll
router.post("/", async (req, res, next) => {
  try {
    const threadId = req.body.threadId;
    const thread = await Thread.findById(req.body.threadId);

    if (!thread) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "invalid thread id",
        value: threadId
      });
    } else if (thread.UserId !== req.session.UserId) {
      throw Errors.requestNotAuthorized;
    } else if (thread.PollQuestionId) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "invalid thread id",
        value: threadId
      });
    }

    const answers = req.body.answers;

    if (!answers || answers.length < 2) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "You must provide at least 2 poll answers",
        value: answers
      });
      // make sure answers are unique
    } else if (answers.length !== new Set(answers).size) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "Answers cannot contain any duplicates",
        value: answers
      });
    }

    const pollQuestion = await PollQuestion.create({
      UserId: req.session.UserId,
      question: req.body.question
    });

    const pollAnswers = await Promise.all(
      answers.map(ans => {
        return PollAnswer.create({ ans });
      })
    );

    // setup the associations
    await thread.setPollQuestion(pollQuestion);
    await Promise.all(
      pollAnswers.map(pollAnswer => {
        return pollQuestion.addPollAnswer(pollAnswer);
      })
    );

    res.json(pollQuestion.toJSON());
  } catch (e) {
    next(e);
  }
});

// POST - vote on a poll
router.post("/:id", async (req, res, next) => {
  try {
    const previousVote = await PollVote.findOne({
      where: { PollQuestionId: req.params.id, UserId: req.session.UserId }
    });

    if (previousVote) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "you cannot vote twice",
        value: req.params.id
      });
    }

    const poll = await PollQuestion.findById(req.params.id, {
      include: [PollAnswer]
    });

    if (!poll) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "invalid poll id",
        value: req.params.id
      });
    }

    const pollAnswer = poll.PollAnswers.find(a => a.answer === req.body.answer);
    if (!pollAnswer) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "invalid answer",
        value: req.body.answer
      });
    }

    const pollVote = await PollVote.create({
      UserId: req.session.UserId
    });
    await pollVote.setPollQuestion(poll);
    await pollVote.setPollAnswer(pollAnswer);

    res.redirect(`/api/v1/poll/${req.params.id}`);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
