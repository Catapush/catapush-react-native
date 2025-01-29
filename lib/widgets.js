import { format, subDays } from 'date-fns';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Catapush from './index';
import { CatapushMessage, CatapushMessageState } from './models';
const formatHour = 'HH:mm';
const formatDay = 'dd MMM';
const styles = StyleSheet.create({
    receivedMessageContainer: {
        flexDirection: 'row',
        paddingLeft: 16,
        paddingTop: 4,
        paddingRight: '25%',
        paddingBottom: 4,
    },
    sentMessageContainer: {
        flexDirection: 'row-reverse',
        paddingLeft: 16,
        paddingTop: 4,
        paddingRight: '25%',
        paddingBottom: 4,
    },
    receivedMessageBubble: {
        width: 'auto',
        flexDirection: 'column',
        padding: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 8,
        backgroundColor: 'grey',
    },
    sentMessageBubble: {
        width: 'auto',
        flexDirection: 'column',
        padding: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 0,
        backgroundColor: '#50BFF7',
    },
    receivedMessageBody: {
        color: 'white',
    },
    sentMessageBody: {
        color: 'white',
    },
    receivedMessageCaption: {
        fontSize: 12,
        color: 'white',
    },
    sentMessageCaption: {
        fontSize: 12,
        color: 'white',
    },
    image: {
        resizeMode: 'contain',
        width: 200,
        height: 200,
    },
});
export function CatapushMessageWidget(props) {
    const [attachmentUrl, setAttachmentUrl] = useState(null);
    const [attachmentError, setAttachmentError] = useState(null);
    useEffect(() => {
        async function getAttachmentUrl() {
            await Catapush.getAttachmentUrlForMessage(props.message)
                .then((attachment) => {
                console.log('ok');
                console.log(attachment.url);
                setAttachmentUrl(attachment.url);
            })
                .catch((error) => {
                console.log('error');
                setAttachmentError(error);
            });
        }
        if (props.message.hasAttachment) {
            getAttachmentUrl();
        }
    }, [props.message]);
    const buildImageBox = () => {
        if (attachmentError != null) {
            return <Text>{attachmentError.toString()}</Text>;
        }
        else if (props.message.hasAttachment && attachmentUrl == null) {
            return <ActivityIndicator size='small'/>;
        }
        else {
            return (<Image style={styles.image} source={{
                    uri: attachmentUrl,
                }}/>);
        }
    };
    const formatMessageDate = () => {
        if (props.message.sentTime == null) {
            return '';
        }
        if (props.message.sentTime > subDays(new Date(), 1)) {
            return format(props.message.sentTime, formatHour);
        }
        else {
            return format(props.message.sentTime, formatDay);
        }
    };
    const confirmedCheck = () => {
        if (props.message.state === CatapushMessageState.RECEIVED_CONFIRMED ||
            props.message.state === CatapushMessageState.OPENED ||
            props.message.state === CatapushMessageState.OPENED_CONFIRMED ||
            props.message.state === CatapushMessageState.SENT_CONFIRMED) {
            return ' ✓';
        }
        else {
            return '';
        }
    };
    const buildReceivedMessage = () => {
        var bubbleStyle;
        if (props.receivedMessageBackgroundColor != null) {
            bubbleStyle = [
                styles.receivedMessageBubble,
                { backgroundColor: props.receivedMessageBackgroundColor },
            ];
        }
        else {
            bubbleStyle = styles.receivedMessageBubble;
        }
        var bodyStyle;
        if (props.receivedMessageTextColor != null) {
            bodyStyle = [
                styles.receivedMessageBody,
                { color: props.receivedMessageTextColor },
            ];
        }
        else {
            bodyStyle = styles.receivedMessageBody;
        }
        var captionStyle;
        if (props.receivedMessageTextColor != null) {
            captionStyle = [
                styles.receivedMessageCaption,
                { color: props.receivedMessageTextColor },
            ];
        }
        else {
            captionStyle = styles.receivedMessageCaption;
        }
        return (<View style={styles.receivedMessageContainer}>
        <View style={bubbleStyle}>
          {props.message.hasAttachment && buildImageBox()}
          <Text style={bodyStyle}>{props.message.body ?? ''}</Text>
          <Text style={captionStyle}>
            {formatMessageDate() + confirmedCheck()}
          </Text>
        </View>
      </View>);
    };
    const buildSentMessage = () => {
        var bubbleStyle;
        if (props.sentMessageBackgroundColor != null) {
            bubbleStyle = [
                styles.sentMessageBubble,
                { backgroundColor: props.sentMessageBackgroundColor },
            ];
        }
        else {
            bubbleStyle = styles.sentMessageBubble;
        }
        var bodyStyle;
        if (props.sentMessageTextColor != null) {
            bodyStyle = [
                styles.sentMessageBody,
                { color: props.sentMessageTextColor },
            ];
        }
        else {
            bodyStyle = styles.sentMessageBody;
        }
        var captionStyle;
        if (props.sentMessageTextColor != null) {
            captionStyle = [
                styles.sentMessageCaption,
                { color: props.sentMessageTextColor },
            ];
        }
        else {
            captionStyle = styles.sentMessageCaption;
        }
        return (<View style={styles.sentMessageContainer}>
        <View style={bubbleStyle}>
          {props.message.hasAttachment && buildImageBox()}
          <Text style={bodyStyle}>{props.message.body ?? ''}</Text>
          <Text style={captionStyle}>
            {formatMessageDate() + confirmedCheck()}
          </Text>
        </View>
      </View>);
    };
    if (props.message.state === CatapushMessageState.SENT ||
        props.message.state === CatapushMessageState.SENT_CONFIRMED) {
        return buildSentMessage();
    }
    else {
        return buildReceivedMessage();
    }
}
CatapushMessageWidget.propTypes = {
    message: PropTypes.instanceOf(CatapushMessage).isRequired,
};
//# sourceMappingURL=widgets.js.map