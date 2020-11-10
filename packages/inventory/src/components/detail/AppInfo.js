/* eslint-disable camelcase */
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Router, useLocation } from "react-router-dom";
import { useStore, useSelector, Provider } from "react-redux";
import {
  Skeleton,
  SkeletonSize,
} from "@redhat-cloud-services/frontend-components/components/cjs/Skeleton";
import { RenderWrapper } from "../../shared";

/**
 * Small component that just renders active detail with some specific class.
 * This component detail is accessed from redux if no component found `missing component` is displayed.
 * @param {*} props `componentsMapper` if you want to pass different components list.
 */
const AppInfo = ({ componentMapper, appList }) => {
  const store = useStore();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const loaded = useSelector(({ entityDetails: { loaded } }) => loaded);
  const entity = useSelector(({ entityDetails: { entity } }) => entity);
  const activeApp = useSelector(
    ({ entityDetails: { activeApps, activeApp, loaded } }) => {
      if (loaded) {
        return (
          (appList || activeApps)?.find?.(
            (item) =>
              item?.name === (searchParams.get("appName") || activeApp?.appName)
          ) || activeApps?.[0]
        );
      }
    }
  );
  const Cmp = componentMapper || activeApp?.component;

  return (
    <Fragment>
      {loaded ? (
        activeApp && (
          <div className={`ins-active-app-${activeApp?.name}`}>
            {Cmp ? (
              <Cmp
                store={store}
                inventoryId={entity.id}
                appName={activeApp?.name}
              />
            ) : (
              "missing component"
            )}
          </div>
        )
      ) : (
        <Skeleton size={SkeletonSize.md} />
      )}
    </Fragment>
  );
};

AppInfo.propTypes = {
  componentMapper: PropTypes.element,
  appList: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.node,
      name: PropTypes.string,
      pageId: PropTypes.string,
    })
  ),
};

// eslint-disable-next-line react/display-name
const AppInfoWrapper = React.forwardRef(
  (
    { history, componentsMapper, isRbacEnabled = true, store, ...props },
    ref
  ) => (
    <Provider store={store}>
      <Router history={history}>
        <RenderWrapper
          hideLoader
          {...props}
          {...componentsMapper}
          isRbacEnabled={isRbacEnabled}
          inventoryRef={ref}
          store={store}
          cmp={AppInfo}
        />
      </Router>
    </Provider>
  )
);

AppInfoWrapper.propTypes = {
  history: PropTypes.object.isRequired,
  componentsMapper: PropTypes.object,
  isRbacEnabled: PropTypes.bool,
  store: PropTypes.object.isRbacEnabled,
};

export default AppInfoWrapper;
