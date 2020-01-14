drop schema if exists DIS;
create schema if not exists DIS default character set utf8 collate utf8_general_ci;
use DIS;

create table trash (
    id bigint auto_increment primary key,
    username varchar(20),
    trashcan char(1),
    type char(1),
    weight int
);

create table config (
    scoreboard varchar(20),
    username varchar(20)
);
