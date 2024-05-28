/// <reference types="react" />
import PropTypes from 'prop-types';
import { CatapushMessage } from './models';
declare type CatapushMessageWidgetProps = {
    message: CatapushMessage;
    receivedMessageBackgroundColor?: string;
    sentMessageBackgroundColor?: string;
    receivedMessageTextColor?: string;
    sentMessageTextColor?: string;
};
export declare function CatapushMessageWidget(props: CatapushMessageWidgetProps): JSX.Element;
export declare namespace CatapushMessageWidget {
    var propTypes: {
        message: PropTypes.Validator<CatapushMessage>;
    };
}
export {};
