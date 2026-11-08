package com.budge.app.data

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {

    @Query("SELECT * FROM transactions ORDER BY receivedAt DESC")
    fun observeAll(): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE type = :type ORDER BY receivedAt DESC")
    fun observeByType(type: String): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE rawMessage = :raw AND receivedAt = :at LIMIT 1")
    suspend fun findDuplicate(raw: String, at: Long): TransactionEntity?

    @Query("SELECT SUM(amount) FROM transactions WHERE type = :type")
    fun observeTotal(type: String): Flow<Double?>

    @Query("SELECT * FROM transactions ORDER BY receivedAt DESC LIMIT :limit")
    suspend fun latest(limit: Int): List<TransactionEntity>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(tx: TransactionEntity): Long

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun delete(id: Long)
}

@Dao
interface RuleDao {

    @Query("SELECT * FROM rules WHERE enabled = 1")
    suspend fun active(): List<RuleEntity>

    @Query("SELECT * FROM rules ORDER BY kind, id")
    fun observeAll(): Flow<List<RuleEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(rule: RuleEntity): Long

    @Query("DELETE FROM rules WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("SELECT COUNT(*) FROM rules")
    suspend fun count(): Int
}

@Database(
    entities = [TransactionEntity::class, RuleEntity::class],
    version = 1,
    exportSchema = false
)
abstract class BudgeDatabase : RoomDatabase() {

    abstract fun transactions(): TransactionDao
    abstract fun rules(): RuleDao

    companion object {
        private const val NAME = "budge.db"

        @Volatile
        private var instance: BudgeDatabase? = null

        /** Get the database. Call once; the BroadcastReceiver and UI share it. */
        fun get(context: android.content.Context): BudgeDatabase =
            instance ?: synchronized(this) {
                instance ?: androidx.room.Room.databaseBuilder(
                    context.applicationContext,
                    BudgeDatabase::class.java,
                    NAME
                ).build().also { instance = it }
            }
    }
}
