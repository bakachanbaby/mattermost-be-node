/* 
const DIALOG_URL = `${process.env.URL_MATTERMOST}/api/v4/actions/dialogs/open`;
const MESSAGE_URL = `${process.env.URL_MATTERMOST}/api/v4/posts`;
const MATTERMOST_ACCESS = process.env.MATTERMOST_ACCESS_TOKEN;
const NGROK_URL = process.env.URL_NGROK;
const POST_URL = `${process.env.URL_MATTERMOST}/api/v4/posts`;
const USER_URL = `${process.env.URL_MATTERMOST}/api/v4/users/username`;
const DIRECT_URL = `${process.env.URL_MATTERMOST}/api/v4/channels/direct`;
*/

const SYSTEM_CONFIG = {
    DIALOG_URL: `${process.env.URL_MATTERMOST}/api/v4/actions/dialogs/open`,
    MESSAGE_URL: `${process.env.URL_MATTERMOST}/api/v4/posts`,
    MATTERMOST_ACCESS: process.env.MATTERMOST_ACCESS_TOKEN,
    NGROK_URL: process.env.URL_NGROK,
    POST_URL: `${process.env.URL_MATTERMOST}/api/v4/posts`,
    USER_URL: `${process.env.URL_MATTERMOST}/api/v4/users/username`,
    DIRECT_URL: `${process.env.URL_MATTERMOST}/api/v4/channels/direct`,
};

module.exports = SYSTEM_CONFIG;
