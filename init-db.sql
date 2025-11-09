-- UniMeet Adatbázis Inicializálás
USE master;
GO

-- Adatbázis létrehozása ha még nem létezik
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'UniMeetDb')
BEGIN
    CREATE DATABASE UniMeetDb;
END
GO

USE UniMeetDb;
GO

-- Engedélyezett email domain-ek hozzáadása
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AllowedEmailDomains')
BEGIN
    IF NOT EXISTS (SELECT * FROM AllowedEmailDomains WHERE Domain = 'uni.hu')
    BEGIN
        INSERT INTO AllowedEmailDomains(Domain) VALUES ('uni.hu');
    END
    
    IF NOT EXISTS (SELECT * FROM AllowedEmailDomains WHERE Domain = 'student.uni-pannon.hu')
    BEGIN
        INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-pannon.hu');
    END
    
    IF NOT EXISTS (SELECT * FROM AllowedEmailDomains WHERE Domain = 'student.uni-elte.hu')
    BEGIN
        INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-elte.hu');
    END
    
    IF NOT EXISTS (SELECT * FROM AllowedEmailDomains WHERE Domain = 'student.uni-bme.hu')
    BEGIN
        INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-bme.hu');
    END
    
    IF NOT EXISTS (SELECT * FROM AllowedEmailDomains WHERE Domain = 'student.uni-bge.hu')
    BEGIN
        INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-bge.hu');
    END
END
GO

PRINT 'Adatbazis inicializalas kesz!';
GO
