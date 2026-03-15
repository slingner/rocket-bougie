alter table shipping_profiles add column parcel_type text not null default 'LGENV';

-- Framed art ships as packages, everything else is a flat envelope
update shipping_profiles set parcel_type = 'PKG' where name like 'Framed%';
