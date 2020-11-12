import React from "react";
import PropTypes from "prop-types";
import { DateByType } from "./helper";

const DateFormat = ({
  date,
  type = "relative",
  extraTitle,
  tooltipProps = {},
}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  // Prevent treating null as valid. (new Date(null) == new Date(0) returns 1970 Jan 1)
  const invalid =
    date === undefined ||
    date === null ||
    dateObj.toString() === "Invalid Date";
  const dateType = invalid ? "invalid" : type;
  return (
    <DateByType
      type={dateType}
      tooltipProps={tooltipProps}
      extraTitle={extraTitle}
      date={dateObj}
    />
  );
};

DateFormat.propTypes = {
  date: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number,
  ]),
  type: PropTypes.oneOf(["exact", "onlyDate", "relative"]),
  extraTitle: PropTypes.string,
  tooltipProps: PropTypes.shape({
    [PropTypes.string]: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  }),
};

export default DateFormat;
