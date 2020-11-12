import React, { Fragment } from "react";
import PropTypes from "prop-types";

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;
const month = day * 30; // let's count that every month has 30 days
const year = day * 365;
const formatTime = (number, unit) =>
  `${number} ${number > 1 ? `${unit}s` : unit} ago`;

const relativeTimeTable = [
  {
    rightBound: Infinity,
    description: (date) => formatTime(Math.round(date / year), "year"),
  },
  {
    rightBound: year,
    description: (date) => formatTime(Math.round(date / month), "month"),
  },
  {
    rightBound: month,
    description: (date) => formatTime(Math.round(date / day), "day"),
  },
  {
    rightBound: day,
    description: (date) => formatTime(Math.round(date / hour), "hour"),
  },
  {
    rightBound: hour,
    description: (date) => formatTime(Math.round(date / minute), "minute"),
  },
  { rightBound: minute, description: () => "Just now" },
];

const exact = (value) => value.toUTCString().split(",")[1].slice(0, -7).trim();

export const AddTooltip = ({
  date,
  element,
  tooltipProps,
  extraTitle = "",
}) => {
  return (
    <Fragment>
      {element}
      {date}
    </Fragment>
  );
};

AddTooltip.propTypes = {
  date: PropTypes.any,
  element: PropTypes.node,
  tooltipProps: PropTypes.object,
  extraTitle: PropTypes.node,
};

export const dateStringByType = (type) =>
  ({
    exact: (date) => exact(date) + " UTC",
    onlyDate: (date) => exact(date).slice(0, -6),
    relative: (date) =>
      relativeTimeTable.reduce(
        (acc, i) =>
          i.rightBound > Date.now() - date
            ? i.description(Date.now() - date)
            : acc,
        exact(date)
      ),
    invalid: () => "Invalid date",
  }[type]);

export const DateByType = ({ type, tooltipProps, extraTitle, date }) => {
  if (type === "exact") {
    return <Fragment>{dateStringByType(type)(date)}</Fragment>;
  }
  if (type === "onlyDate") {
    return <Fragment>{dateStringByType(type)(date)}</Fragment>;
  }
  if (type === "relative") {
    return (
      <AddTooltip
        date={dateStringByType("exact")(date)}
        element={<span>{dateStringByType(type)(date)}</span>}
        tooltipProps={tooltipProps}
        extraTitle={extraTitle}
      />
    );
  }
  return <Fragment>Invalid date</Fragment>;
};

DateByType.propTypes = {
  type: PropTypes.string,
  tooltipProps: PropTypes.object,
  extraTitle: PropTypes.node,
  date: PropTypes.any,
};
