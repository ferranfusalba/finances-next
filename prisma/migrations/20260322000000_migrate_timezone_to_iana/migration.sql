-- Migrate timezone values from numeric offsets to IANA timezone identifiers.
-- The old format stored offsets like "1", "-5", "0", "5.5".
-- This maps each offset to a representative IANA zone (best-effort).

-- Add timezoneOffset column to both tables
ALTER TABLE "AccountTransaction" ADD COLUMN "timezoneOffset" TEXT DEFAULT '';
ALTER TABLE "BudgetTransaction" ADD COLUMN "timezoneOffset" TEXT DEFAULT '';

-- AccountTransaction: backfill timezoneOffset from old numeric values, then migrate timezone to IANA id
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-12',    "timezone" = 'Etc/GMT+12'            WHERE "timezone" = '-12';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-11',    "timezone" = 'Etc/GMT+11'            WHERE "timezone" = '-11';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-10',    "timezone" = 'Pacific/Honolulu'      WHERE "timezone" = '-10';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-09',    "timezone" = 'America/Anchorage'     WHERE "timezone" = '-9';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-08',    "timezone" = 'America/Anchorage'     WHERE "timezone" = '-8';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-07',    "timezone" = 'America/Los_Angeles'   WHERE "timezone" = '-7';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-06',    "timezone" = 'America/Chicago'       WHERE "timezone" = '-6';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-05',    "timezone" = 'America/New_York'      WHERE "timezone" = '-5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-04:30', "timezone" = 'America/Caracas'       WHERE "timezone" = '-4.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-04',    "timezone" = 'America/Santiago'      WHERE "timezone" = '-4';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-03:30', "timezone" = 'America/St_Johns'      WHERE "timezone" = '-3.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-03',    "timezone" = 'America/Sao_Paulo'     WHERE "timezone" = '-3';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-02',    "timezone" = 'Atlantic/South_Georgia' WHERE "timezone" = '-2';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC-01',    "timezone" = 'Atlantic/Cape_Verde'   WHERE "timezone" = '-1';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+00',    "timezone" = 'Etc/UTC'               WHERE "timezone" = '0';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+00',    "timezone" = 'Etc/UTC'               WHERE "timezone" = 'UTC';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+01',    "timezone" = 'Europe/Brussels'       WHERE "timezone" = '1';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+02',    "timezone" = 'Europe/Andorra'         WHERE "timezone" = '2';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+03',    "timezone" = 'Europe/Moscow'         WHERE "timezone" = '3';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+03:30', "timezone" = 'Asia/Tehran'           WHERE "timezone" = '3.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+04',    "timezone" = 'Asia/Dubai'            WHERE "timezone" = '4';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+04:30', "timezone" = 'Asia/Kabul'            WHERE "timezone" = '4.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+05',    "timezone" = 'Asia/Karachi'          WHERE "timezone" = '5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+05:30', "timezone" = 'Asia/Kolkata'          WHERE "timezone" = '5.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+05:45', "timezone" = 'Asia/Kathmandu'        WHERE "timezone" = '5.75';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+06',    "timezone" = 'Asia/Dhaka'            WHERE "timezone" = '6';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+06:30', "timezone" = 'Asia/Rangoon'          WHERE "timezone" = '6.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+07',    "timezone" = 'Asia/Bangkok'          WHERE "timezone" = '7';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+08',    "timezone" = 'Asia/Shanghai'         WHERE "timezone" = '8';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+09',    "timezone" = 'Asia/Tokyo'            WHERE "timezone" = '9';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+09:30', "timezone" = 'Australia/Adelaide'    WHERE "timezone" = '9.5';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+10',    "timezone" = 'Australia/Sydney'      WHERE "timezone" = '10';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+11',    "timezone" = 'Pacific/Noumea'        WHERE "timezone" = '11';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+12',    "timezone" = 'Pacific/Auckland'      WHERE "timezone" = '12';
UPDATE "AccountTransaction" SET "timezoneOffset" = 'UTC+13',    "timezone" = 'Pacific/Tongatapu'     WHERE "timezone" = '13';

-- BudgetTransaction (same mapping)
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-12',    "timezone" = 'Etc/GMT+12'            WHERE "timezone" = '-12';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-11',    "timezone" = 'Etc/GMT+11'            WHERE "timezone" = '-11';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-10',    "timezone" = 'Pacific/Honolulu'      WHERE "timezone" = '-10';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-09',    "timezone" = 'America/Anchorage'     WHERE "timezone" = '-9';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-08',    "timezone" = 'America/Anchorage'     WHERE "timezone" = '-8';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-07',    "timezone" = 'America/Los_Angeles'   WHERE "timezone" = '-7';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-06',    "timezone" = 'America/Chicago'       WHERE "timezone" = '-6';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-05',    "timezone" = 'America/New_York'      WHERE "timezone" = '-5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-04:30', "timezone" = 'America/Caracas'       WHERE "timezone" = '-4.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-04',    "timezone" = 'America/Santiago'      WHERE "timezone" = '-4';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-03:30', "timezone" = 'America/St_Johns'      WHERE "timezone" = '-3.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-03',    "timezone" = 'America/Sao_Paulo'     WHERE "timezone" = '-3';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-02',    "timezone" = 'Atlantic/South_Georgia' WHERE "timezone" = '-2';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC-01',    "timezone" = 'Atlantic/Cape_Verde'   WHERE "timezone" = '-1';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+00',    "timezone" = 'Etc/UTC'               WHERE "timezone" = '0';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+00',    "timezone" = 'Etc/UTC'               WHERE "timezone" = 'UTC';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+01',    "timezone" = 'Europe/Brussels'       WHERE "timezone" = '1';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+02',    "timezone" = 'Europe/Andorra'         WHERE "timezone" = '2';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+03',    "timezone" = 'Europe/Moscow'         WHERE "timezone" = '3';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+03:30', "timezone" = 'Asia/Tehran'           WHERE "timezone" = '3.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+04',    "timezone" = 'Asia/Dubai'            WHERE "timezone" = '4';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+04:30', "timezone" = 'Asia/Kabul'            WHERE "timezone" = '4.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+05',    "timezone" = 'Asia/Karachi'          WHERE "timezone" = '5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+05:30', "timezone" = 'Asia/Kolkata'          WHERE "timezone" = '5.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+05:45', "timezone" = 'Asia/Kathmandu'        WHERE "timezone" = '5.75';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+06',    "timezone" = 'Asia/Dhaka'            WHERE "timezone" = '6';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+06:30', "timezone" = 'Asia/Rangoon'          WHERE "timezone" = '6.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+07',    "timezone" = 'Asia/Bangkok'          WHERE "timezone" = '7';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+08',    "timezone" = 'Asia/Shanghai'         WHERE "timezone" = '8';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+09',    "timezone" = 'Asia/Tokyo'            WHERE "timezone" = '9';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+09:30', "timezone" = 'Australia/Adelaide'    WHERE "timezone" = '9.5';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+10',    "timezone" = 'Australia/Sydney'      WHERE "timezone" = '10';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+11',    "timezone" = 'Pacific/Noumea'        WHERE "timezone" = '11';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+12',    "timezone" = 'Pacific/Auckland'      WHERE "timezone" = '12';
UPDATE "BudgetTransaction" SET "timezoneOffset" = 'UTC+13',    "timezone" = 'Pacific/Tongatapu'     WHERE "timezone" = '13';

-- User defaultTimezone (same mapping, no offset column needed)
UPDATE "User" SET "defaultTimezone" = 'Etc/GMT+12'            WHERE "defaultTimezone" = '-12';
UPDATE "User" SET "defaultTimezone" = 'Etc/GMT+11'            WHERE "defaultTimezone" = '-11';
UPDATE "User" SET "defaultTimezone" = 'Pacific/Honolulu'      WHERE "defaultTimezone" = '-10';
UPDATE "User" SET "defaultTimezone" = 'America/Anchorage'     WHERE "defaultTimezone" = '-9';
UPDATE "User" SET "defaultTimezone" = 'America/Anchorage'     WHERE "defaultTimezone" = '-8';
UPDATE "User" SET "defaultTimezone" = 'America/Los_Angeles'   WHERE "defaultTimezone" = '-7';
UPDATE "User" SET "defaultTimezone" = 'America/Chicago'       WHERE "defaultTimezone" = '-6';
UPDATE "User" SET "defaultTimezone" = 'America/New_York'      WHERE "defaultTimezone" = '-5';
UPDATE "User" SET "defaultTimezone" = 'America/Caracas'       WHERE "defaultTimezone" = '-4.5';
UPDATE "User" SET "defaultTimezone" = 'America/Santiago'      WHERE "defaultTimezone" = '-4';
UPDATE "User" SET "defaultTimezone" = 'America/St_Johns'      WHERE "defaultTimezone" = '-3.5';
UPDATE "User" SET "defaultTimezone" = 'America/Sao_Paulo'     WHERE "defaultTimezone" = '-3';
UPDATE "User" SET "defaultTimezone" = 'Atlantic/South_Georgia' WHERE "defaultTimezone" = '-2';
UPDATE "User" SET "defaultTimezone" = 'Atlantic/Cape_Verde'   WHERE "defaultTimezone" = '-1';
UPDATE "User" SET "defaultTimezone" = 'Etc/UTC'               WHERE "defaultTimezone" = '0';
UPDATE "User" SET "defaultTimezone" = 'Etc/UTC'               WHERE "defaultTimezone" = 'UTC';
UPDATE "User" SET "defaultTimezone" = 'Europe/Brussels'       WHERE "defaultTimezone" = '1';
UPDATE "User" SET "defaultTimezone" = 'Europe/Andorra'         WHERE "defaultTimezone" = '2';
UPDATE "User" SET "defaultTimezone" = 'Europe/Moscow'         WHERE "defaultTimezone" = '3';
UPDATE "User" SET "defaultTimezone" = 'Asia/Tehran'           WHERE "defaultTimezone" = '3.5';
UPDATE "User" SET "defaultTimezone" = 'Asia/Dubai'            WHERE "defaultTimezone" = '4';
UPDATE "User" SET "defaultTimezone" = 'Asia/Kabul'            WHERE "defaultTimezone" = '4.5';
UPDATE "User" SET "defaultTimezone" = 'Asia/Karachi'          WHERE "defaultTimezone" = '5';
UPDATE "User" SET "defaultTimezone" = 'Asia/Kolkata'          WHERE "defaultTimezone" = '5.5';
UPDATE "User" SET "defaultTimezone" = 'Asia/Kathmandu'        WHERE "defaultTimezone" = '5.75';
UPDATE "User" SET "defaultTimezone" = 'Asia/Dhaka'            WHERE "defaultTimezone" = '6';
UPDATE "User" SET "defaultTimezone" = 'Asia/Rangoon'          WHERE "defaultTimezone" = '6.5';
UPDATE "User" SET "defaultTimezone" = 'Asia/Bangkok'          WHERE "defaultTimezone" = '7';
UPDATE "User" SET "defaultTimezone" = 'Asia/Shanghai'         WHERE "defaultTimezone" = '8';
UPDATE "User" SET "defaultTimezone" = 'Asia/Tokyo'            WHERE "defaultTimezone" = '9';
UPDATE "User" SET "defaultTimezone" = 'Australia/Adelaide'    WHERE "defaultTimezone" = '9.5';
UPDATE "User" SET "defaultTimezone" = 'Australia/Sydney'      WHERE "defaultTimezone" = '10';
UPDATE "User" SET "defaultTimezone" = 'Pacific/Noumea'        WHERE "defaultTimezone" = '11';
UPDATE "User" SET "defaultTimezone" = 'Pacific/Auckland'      WHERE "defaultTimezone" = '12';
UPDATE "User" SET "defaultTimezone" = 'Pacific/Tongatapu'     WHERE "defaultTimezone" = '13';
