import { StringValidateOptions } from './validate';

export const BACKGR_COLOR = '#fff';
export const INPUT_BACKGR_COLOR = '#ebebeb';

// validation
export const USERNAME_VALIDATION: StringValidateOptions = {
    minLength: 1,
    maxLength: 16,
    alphanumeric: true,
};
export const DISPLAYNAME_VALIDATION: StringValidateOptions = {
    maxLength: 32,
};
export const BIO_VALIDATION: StringValidateOptions = {
    maxLength: 200,
};
export const PASSWORD_VALIDATION: StringValidateOptions = {
    minLength: 8,
    maxLength: 64,
};

// https://mapstyle.withgoogle.com/
export const GOOGLE_MAPS_STYLE = [
    {
        featureType: 'poi.business',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
];
