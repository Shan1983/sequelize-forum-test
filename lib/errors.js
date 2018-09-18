const Errors = {
  unknown: [
    "An unknown error occured on the systems end. Please try again",
    500
  ],
  accountAlreadyCreated: [
    "Looks like this account has already been created",
    400
  ],
  categoryAlreadyExists: [
    "Looks like this category already exists, use that one",
    400
  ],
  accountDoesNotExists: [
    "Hmm, you sure you entered the right login details?",
    400
  ],
  invalidCategory: ["That category does not exists", 400],
  invalidLoginCredentials: [
    "The username or Password that was provided is incorrect",
    401
  ],
  requestNotAuthorized: ["Hold up! you can't do that", 401],
  invalidToken: ["Hmm, should we call security? Your token is whacked", 401],
  noSettings: [`You haven't added any settings, go do it now`, 500],
  passwordSame: [
    `You used that password before. Think of a new one and try again`,
    400
  ],
  cannotLikeOwnPost: [
    "Haha! your such a narcissist ;) you can't like your own posts",
    400
  ],
  threadLocked: ["This thread is locked! You can't post to it", 400],
  postRemoved: [
    "The post you are replying to has been removed, you can no longer reply",
    400
  ],
  invalidParameter(param, message) {
    if (message) {
      const punctuateMessage = `: ${message}`;
    }

    return [`${param} is invalid${punctuateMessage}`, 400];
  },
  missingParameterType(param, type) {
    return [`missing ${param}`, 400];
  },
  invalidParameterType(param, type) {
    return [`${param} must be of type ${type}`];
  },
  parameterLengthTooSmall(param, length) {
    return [`${param} must be more than ${length} characters in length`, 400];
  },
  parameterLengthTooLarge(param, length) {
    return [`${param} must be less than ${length} characters in length`, 400];
  }
};

let processedErrors = {};
const processErrors = errorName => {
  let temp;

  if (typeof Errors[errorName] === "function") {
    temp = () => {
      const arr = Errors[errorName](...arguments);
      return {
        name: errorName,
        message: arr[0],
        status: arr[1],
        parameter: arguments[0]
      };
    };
  } else {
    const arr = Errors[errorName];

    temp = {};
    temp.name = errorName;
    temp.message = arr[0];
    temp.status = arr[1];
  }

  return temp;
};

for (var errorName in Errors) {
  processedErrors[errorName] = processErrors(errorName);
}

processedErrors.VALIDATION_ERROR = "VALIDATION_ERROR";

processedErrors.sequelizeValidation = (sequelize, obj) => {
  return new sequelize.ValidationError(obj.error, [
    new sequelize.ValidationErrorItem(
      obj.error,
      "validation error",
      obj.path,
      obj.path
    )
  ]);
};

module.exports = processedErrors;
