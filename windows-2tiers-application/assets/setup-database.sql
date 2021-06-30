USE master;
GO
CREATE DATABASE Northwind
GO

Use Northwind

CREATE TABLE Customers (
    CustomerID nchar(5) not null,
    ContactName NVarchar(30)
);

GO

create proc
[dbo].[SearchCustomers](@SearchText varchar(30))
as
Select CustomerID, ContactName from dbo.Customers
Where ContactName Like
'%' + @SearchText + '%'
order by ContactName asc

Go

Insert into dbo.Customers(CustomerID, ContactName) values('001','michael@example.com')
Insert into dbo.Customers(CustomerID, ContactName) values('002','tom@example.com')

