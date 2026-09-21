<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained();
            $table->foreignId('academic_term_id')->constrained();
            $table->foreignId('instructor_id')->constrained('users');
            $table->string('section');
            $table->string('schedule');
            $table->string('room')->nullable();
            $table->unsignedSmallInteger('capacity');
            $table->string('status')->default('ACTIVE')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_offerings');
    }
};
