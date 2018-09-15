const getNextId = async (Model, where, items) => {
  try {
    const maxId = await Model.max("id", { where });
    const lastItem = items.slice(-1)[0];

    if (!lastItem || maxId === lastItem.id) {
      return null;
    } else {
      return lastItem.id;
    }
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getNextIdDesc = async (Model, where, items) => {
  try {
    const minId = await Model.min("id", { where });
    const lastItem = items.slice(-1)[0];

    if (!lastItem || minId === lastItem.id) {
      return null;
    } else {
      return lastItem.id;
    }
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getNextCount = async (Model, items, limit, where, desc) => {
  let lastItem;

  if (Array.isArray(items)) {
    lastItem = items.slice(-1)[0];
  } else {
    lastItem = items;
  }

  if (desc) {
    where.id = { $lt: lastItem.id };
  } else {
    where.id = { $ge: lastItem.id };
  }

  const remaining = await Model.count({ where });

  if (remaining - limit < 0) {
    return remaining;
  } else {
    return limit;
  }
};

const getPaginationProps = async (query, desc) => {
  let from = 0;
  let limit = 10;

  if (desc) {
    from = null;
  }

  if (+query.from > 0) from = +query.from;
  if (+query.limit > 0) limit = +query.limit;

  if (+query.postNumber > 0) {
    const lowerFrom = +query.postNumber - Math.floor(limit / 2) + 1;

    if (lowerFrom < 0) {
      from = 0;
    } else {
      from = lowerFrom;
    }
  }

  return { from, limit };
};

module.exports = {
  getNextId,
  getNextIdDesc,
  getNextCount,
  getPaginationProps
};
