import React from 'react';
import {Route, Redirect, RouteProps} from 'react-router-dom';

export type ProtectedRouteProps = {
    neededRole: string[];
    redirectPath: string;
    currentUserRole: string;
    extraCondition?: boolean;
} & RouteProps;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = (
    {
        neededRole,
        redirectPath,
        currentUserRole,
        extraCondition,
        ...routeProps
    }
) => {
    if (neededRole.includes(currentUserRole) && (extraCondition !== undefined && extraCondition || !extraCondition)) {
        return <Route {...routeProps} />;
    } else {
        return <Redirect to={{pathname: redirectPath}}/>;
    }
};