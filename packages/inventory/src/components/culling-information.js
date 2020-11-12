import React from "react";
import PropTypes from "prop-types";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import classnames from "classnames";

import "./culling-information.scss";

const seconds = 1000;
const minutes = seconds * 60;
const hours = minutes * 60;
const days = hours * 24;

const calculateTooltip = (culled, warning, currDate) => {
  const culledDate = new Date(culled);
  const warningDate = new Date(warning);
  const diffTime = currDate - warningDate;
  const removeIn = Math.ceil((culledDate - currDate) / days);
  const msg = `System scheduled for inventory removal in ${removeIn} days`;
  if (diffTime >= 0) {
    return {
      isError: true,
      msg,
    };
  }

  return {
    isWarn: true,
    msg,
  };
};

const CullingInformation = ({
  culled,
  staleWarning,
  currDate,
  children,
  render,
  Component,
  ...props
}) => {
  const { isWarn, isError, msg } = calculateTooltip(
    culled,
    staleWarning,
    currDate
  );
  /**  if (Component) {
    return (
      <span
        className={classnames({
          "ins-c-inventory__culling-warning": isWarn,
          "ins-c-inventory__culling-danger": isError,
        })}
      >
        {isWarn && <ExclamationTriangleIcon />}
        {isError && <ExclamationCircleIcon />}
        <Component msg={msg} />
      </span>
    );
  }*/

  return (
    // <Tooltip {...props} content={msg}>
    <span
      className={classnames({
        "ins-c-inventory__culling-warning": isWarn,
        "ins-c-inventory__culling-danger": isError,
      })}
    >
      {isError && <ExclamationCircleIcon />}
      {isWarn && <ExclamationTriangleIcon />}
      {children}
    </span>
    // </Tooltip>
  );
};

CullingInformation.propTypes = {
  culled: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
  staleWarning: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
  stale: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
  currDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
  render: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]).isRequired,
};
CullingInformation.defaultProps = {
  culled: new Date(0),
  staleWarning: new Date(0),
  currDate: new Date(),
};
export default CullingInformation;
