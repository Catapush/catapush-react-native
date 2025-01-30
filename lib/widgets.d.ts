import PropTypes from 'prop-types';
import React from 'react';
import { CatapushMessage } from './models';
type CatapushMessageWidgetProps = {
    message: CatapushMessage;
    receivedMessageBackgroundColor?: string;
    sentMessageBackgroundColor?: string;
    receivedMessageTextColor?: string;
    sentMessageTextColor?: string;
};
export declare function CatapushMessageWidget(props: CatapushMessageWidgetProps): React.JSX.Element;
export declare namespace CatapushMessageWidget {
    var propTypes: {
        message: PropTypes.Validator<CatapushMessage>;
    };
}
export {};
