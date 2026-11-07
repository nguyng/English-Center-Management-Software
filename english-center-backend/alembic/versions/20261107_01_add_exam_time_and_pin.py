"""add_exam_time_and_pin

Revision ID: 20261107_01
Revises: 
Create Date: 2026-11-07 18:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20261107_01'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add gio_mo_de, gio_dong_de, ma_vao_thi to bai_kiem_tra table
    op.add_column(
        'bai_kiem_tra',
        sa.Column('gio_mo_de', sa.String(length=10), nullable=True, server_default='08:00')
    )
    op.add_column(
        'bai_kiem_tra',
        sa.Column('gio_dong_de', sa.String(length=10), nullable=True, server_default='22:00')
    )
    op.add_column(
        'bai_kiem_tra',
        sa.Column('ma_vao_thi', sa.String(length=20), nullable=True, server_default='1234')
    )

def downgrade() -> None:
    op.drop_column('bai_kiem_tra', 'ma_vao_thi')
    op.drop_column('bai_kiem_tra', 'gio_dong_de')
    op.drop_column('bai_kiem_tra', 'gio_mo_de')

