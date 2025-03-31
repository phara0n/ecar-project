# PgBouncer Configuration for ECAR Project

This directory contains the configuration files for PgBouncer connection pooling in the ECAR Garage Management System.

## Files

- `pgbouncer.ini` - Main PgBouncer configuration file
- `userlist.txt` - Authentication file with user credentials (MD5 hashed)

## Configuration Summary

The current PgBouncer configuration uses the following main settings:

- **Pool Mode**: `transaction` (pooling based on transaction boundaries)
- **Maximum Client Connections**: 100 concurrent clients
- **Default Pool Size**: 20 server connections per database
- **Minimum Pool Size**: 5 idle connections maintained
- **Reserve Pool Size**: 10 additional connections when pool is full

## Adding New Users

To add a new user to `userlist.txt`, generate an MD5 hash of their password:

```bash
echo -n "PASSWORD_HEREusername" | md5sum | awk '{print "md5" $1}'
```

Then add the user and hashed password to `userlist.txt`:

```
"username" "md5HASH_HERE"
```

## Monitoring

Monitor PgBouncer status using the Django management command:

```bash
python manage.py monitor_pgbouncer
```

Or use the shell script:

```bash
./scripts/check_pgbouncer.sh
```

## Health Check

The healthcheck uses `pg_isready` to verify that PgBouncer is accepting connections:

```bash
pg_isready -h pgbouncer -p 6432 -U pgbouncer -d pgbouncer
```

## Reference Documentation

- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [ECAR Connection Pooling Setup](../../../docs/connection_pooling_setup.md)
- [ECAR Connection Pooling Docker Setup](../../../docs/connection_pooling_docker_setup.md) 